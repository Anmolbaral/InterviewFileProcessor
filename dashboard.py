"""Build the dashboard's data bundle from the verified transcripts and the stored findings, prepare the clickable
questions from that evidence, and check that every shipped quotation still matches its source version."""

from __future__ import annotations

import argparse
import json
import sqlite3
import zipfile
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from xml.etree import ElementTree as ET

from pydantic import Field

from extract import (CONTRACT_VERSION, DEFAULT_FINDINGS, CompanyContext, Finding, attribution_flags, build_batches,
                     check_findings, load_records, load_runs, open_findings)
from parser import (BASE, DEFAULT_DATABASE, DEFAULT_MANIFEST, PARSER_VERSION, Record, fingerprint, open_database,
                    read_rows, render_passages, run)

DASHBOARD_VERSION = "1.0.0"
DEFAULT_BUNDLE = BASE / "web/src/data/bundle.json"
KINDS = ["company_scale", "vendor_relationship", "selection_criteria", "pricing", "implementation", "rating"]
STATES = ["proposed", "reviewed", "edited", "rejected"]
STATE_LABELS = {"proposed": "Model proposal, unreviewed", "reviewed": "Reviewed against cited passages",
                "edited": "Analyst-edited draft, not reviewed", "rejected": "Rejected"}
UNNAMED_VENDOR = "custom or unnamed system"
FRAMING = {
    "title": "Analytics Dashboard",
    "client_question": "What is the market share for each major ITSM vendor across customer types, and why?",
    "scope": "Three AI-led expert interviews on enterprise ITSM platform buying, giving four substantive company "
             "contexts from three respondents: one historical and one current employer for Expert 1, one current "
             "employer each for Experts 2 and 3.",
    "market_share_unestimated": "Three interviews cannot establish market share. There is no market definition, "
                                "sampling frame, population denominator, weighting, or reliable interview date, so no "
                                "percentage is shown anywhere. The evidence does support observed vendor relationships "
                                "per company, the reasons given for choosing or rejecting vendors, prices in the units "
                                "the experts used, implementation experience, and the caveats around each.",
    "caveats": [
        "Expert 1's ServiceNow account is historical, from Thermo Fisher; the current employer runs a custom ITSM.",
        "Interviewer statements are not expert evidence; agreement to a premise is labeled prompted agreement.",
        "Prices keep their own units and basis (per user, per agent, quote, paid) and are never averaged across "
        "interviews.",
        "Where two accounts of the same event conflict, both are shown and the tension stays unresolved.",
        "Findings labeled model proposals have not been reviewed; only reviewed findings were checked by a person.",
    ],
}


class Question(Record):
    id: str
    text: str
    kinds: list[str] = Field(default_factory=list)
    documents: list[str] = Field(default_factory=list)
    vendors: list[str] = Field(default_factory=list)  # case-insensitive substrings of the finding's vendor
    relationships: list[str] = Field(default_factory=list)


class Evidence(Record):
    """What a question may draw on: live findings per company context in scope, and their citations in source order."""
    finding_ids: list[str]
    citation_ids: list[str]
    by_context: dict[str, list[str]]


class CaseSummary(Record):
    context_id: str
    summary: str | None = None
    finding_ids: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)


class Answer(Record):
    question_id: str
    status: Literal["generated", "prepared", "withheld"]
    model: str
    prompt_version: str
    input_fingerprint: str = Field(pattern=r"^[0-9a-f]{64}$")
    finding_ids: list[str]
    citation_ids: list[str]
    by_context: dict[str, list[str]]
    answer: str | None = None
    per_case: list[CaseSummary] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    tensions: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)
    error: str | None = None


QUESTIONS = [
    Question(id="Q1", text="Which vendors are used or evaluated in these company contexts, and why?",
             kinds=["vendor_relationship", "selection_criteria"]),
    Question(id="Q2", text="What explains accepting or rejecting ServiceNow's price premium?",
             kinds=["pricing", "selection_criteria"], vendors=["servicenow"]),
    Question(id="Q3", text="What can these interviews tell us about vendor fit, and what is missing to estimate "
                           "market share?", kinds=["company_scale", "vendor_relationship", "selection_criteria"]),
    Question(id="Q4", text="Which platform does Expert 1 currently use?", documents=["E1"],
             kinds=["vendor_relationship"]),
    Question(id="Q5", text="Why did Calloway choose BMC over ServiceNow?", documents=["E2"],
             kinds=["selection_criteria", "pricing"], vendors=["bmc", "servicenow"]),
    Question(id="Q6", text="What does Freshservice cost in the Solara interview?", documents=["E3"],
             kinds=["pricing"], vendors=["freshservice"]),
    Question(id="Q7", text="Is any company moving to ServiceNow?", kinds=["vendor_relationship"],
             vendors=["servicenow"], relationships=["hypothetical", "evaluated"]),
    Question(id="Q8", text="Was the BMC implementation faster than planned?", documents=["E2"],
             kinds=["implementation"]),
]


def citation_map(transcripts: sqlite3.Connection) -> dict[str, str]:
    """physical passage ID -> citation ID, for every nonempty passage."""
    return {row["id"]: row["citation_id"] for row in read_rows(
        transcripts, "SELECT id, citation_id FROM passages WHERE citation_id IS NOT NULL")}


def expected_fingerprints(transcripts: sqlite3.Connection) -> dict[str, str]:
    return {row["id"]: row["extraction_sha256"]
            for row in read_rows(transcripts, "SELECT id, extraction_sha256 FROM documents")}


def cited(transcripts: sqlite3.Connection, findings: list[Finding]) -> list[str]:
    """Citation IDs of every passage these findings cite, in source order, each once."""
    ids = list(dict.fromkeys(i for finding in findings for i in finding.passage_ids))
    rows = render_passages(transcripts, ids, expected_fingerprints=expected_fingerprints(transcripts))
    return [row["citation_id"] for row in rows]


def select_evidence(transcripts: sqlite3.Connection, store: sqlite3.Connection, question: Question) -> Evidence:
    """Live findings that match the question's filters, considered for every company context in scope so a gap
    is visible as an empty list rather than an absence."""
    contexts = [c for c in load_records(store, CompanyContext) if c.review_state != "rejected"
                and (not question.documents or c.document_id in question.documents)]
    findings = [f for f in load_records(store, Finding) if f.review_state != "rejected"
                and (not question.documents or f.document_id in question.documents)
                and (not question.kinds or f.kind in question.kinds)
                and (not question.relationships or f.relationship in question.relationships)
                and (not question.vendors or (f.vendor and any(v in f.vendor.lower() for v in question.vendors)))]
    by_context = {c.id: [f.id for f in findings if f.context_id == c.id] for c in contexts}
    matched = [f for f in findings if f.context_id in by_context]
    return Evidence(finding_ids=[f.id for f in matched], citation_ids=cited(transcripts, matched),
                    by_context=by_context)


def fallback_answer(question: Question, evidence: Evidence, *, transcripts: sqlite3.Connection | None = None,
                    store: sqlite3.Connection | None = None) -> Answer:
    """The deterministic answer: the matching findings listed per company context, with no prose and no model."""
    per_case = [CaseSummary(context_id=context_id, finding_ids=ids) for context_id, ids in evidence.by_context.items()]
    gaps = [f"No matching findings for {context_id} in this evidence." for context_id, ids in evidence.by_context.items()
            if not ids]
    if question.id == "Q3":
        gaps.append(FRAMING["market_share_unestimated"])
    return Answer(question_id=question.id, status="prepared", model="none", prompt_version="none",
                  input_fingerprint=fingerprint([question.model_dump(), evidence.model_dump()]),
                  finding_ids=evidence.finding_ids, citation_ids=evidence.citation_ids, by_context=evidence.by_context,
                  per_case=per_case, gaps=gaps)


def validate_answer(answer: Answer, evidence: Evidence, transcripts: sqlite3.Connection) -> Answer:
    """A generated answer may cite only what it was given, and every citation must still resolve at the stored
    version. Any violation withholds the prose and every per-case summary, keeps the reason, and ships the listing."""
    citations = set(answer.citations) | {c for case in answer.per_case for c in case.citations}
    findings = set(answer.finding_ids) | {f for case in answer.per_case for f in case.finding_ids}
    problems = []
    if unsupplied := sorted(citations - set(evidence.citation_ids)):
        problems.append(f"citations not in the supplied evidence: {', '.join(unsupplied)}")
    if foreign := sorted(findings - set(evidence.finding_ids)):
        problems.append(f"findings not in the supplied evidence: {', '.join(foreign)}")
    if not problems:
        physical = {value: key for key, value in citation_map(transcripts).items()}
        try:
            render_passages(transcripts, [physical[c] for c in sorted(citations) if c in physical],
                            expected_fingerprints=expected_fingerprints(transcripts))
        except ValueError as error:
            problems.append(str(error))
    if not problems:
        return answer
    listing = [CaseSummary(context_id=context_id, finding_ids=ids) for context_id, ids in evidence.by_context.items()]
    return answer.model_copy(update=dict(status="withheld", answer=None, per_case=listing, citations=[],
                                         error="; ".join(problems)))


def review_notes(store: sqlite3.Connection) -> dict[str, str | None]:
    """The latest reviewer note per record."""
    notes: dict[str, str | None] = {}
    if store.execute("SELECT 1 FROM sqlite_master WHERE name = 'reviews'").fetchone():
        for row in store.execute("SELECT record_id, note FROM reviews ORDER BY id"):
            notes[row["record_id"]] = row["note"]
    return notes


def store_fingerprint(store: sqlite3.Connection) -> str:
    """What the bundle shows from the findings store: every context and finding and the latest review notes."""
    return fingerprint({"contexts": [c.model_dump() for c in load_records(store, CompanyContext)],
                        "findings": [f.model_dump() for f in load_records(store, Finding)],
                        "notes": review_notes(store)})


def build_bundle(transcripts: sqlite3.Connection, store: sqlite3.Connection, corpus, *, answers: list[Answer]) -> dict:
    """Everything the dashboard shows, from verified sources: the whole text corpus with its sections, every stored
    context and finding with run and batch provenance, the comparison matrix and honest counts over live findings,
    the runs' batch outcomes without raw responses, and the prepared questions. Call after `run(check=True)` and
    `check_findings`; the bundle is then checked against the transcripts before it is returned."""
    expected = {document.id: document.extraction_sha256 for document in corpus.documents}
    meta = read_rows(transcripts, "SELECT p.id, p.document_id, p.citation_id, p.paragraph_index, p.kind, p.section_id, "
                     "cp.chunk_id FROM passages p JOIN documents d ON d.id = p.document_id "
                     "LEFT JOIN chunk_passages cp ON cp.passage_id = p.id WHERE p.kind IN ('text', 'heading') "
                     "ORDER BY d.position, p.paragraph_index")
    rendered = {row["id"]: row for row in render_passages(transcripts, [m["id"] for m in meta],
                                                            expected_fingerprints=expected)}
    passages = [{**m, "speaker_label": rendered[m["id"]]["speaker_label"],
                 "timestamp_raw": rendered[m["id"]]["timestamp_raw"], "text": rendered[m["id"]]["text"]} for m in meta]
    batches = {batch.section_id: batch.id for batch in build_batches(transcripts)}
    sections = {p["id"]: {"document_id": p["document_id"], "heading": p["text"].strip(), "citation_id": p["citation_id"],
                          "batch_id": batches.get(p["id"])} for p in passages if p["kind"] == "heading"}
    documents = {document.id: {
        "label": f"Expert {document.id[1:]}", "source_filename": document.source_filename,
        "source_sha256": document.source_sha256, "extraction_sha256": document.extraction_sha256,
        "coverage": document.coverage, "warnings": document.warnings,
        "profile_passage_ids": [p["id"] for p in passages if p["document_id"] == document.id
                                and p["kind"] == "text" and p["section_id"] is None],
    } for document in corpus.documents}
    runs = load_runs(store)
    proposed_in = {record_id: outcome.batch_id for r in runs for outcome in r.batches
                   for record_id in outcome.finding_ids + outcome.context_ids}
    run_of = {row["id"]: row["run_id"] for table in ("company_contexts", "findings")
              for row in store.execute(f"SELECT id, run_id FROM {table}")}
    notes = review_notes(store)
    flags = attribution_flags(store, transcripts)
    contexts = [{**c.model_dump(), "run_id": run_of.get(c.id), "batch_id": proposed_in.get(c.id),
                 "review_note": notes.get(c.id)} for c in load_records(store, CompanyContext)]
    findings = [{**f.model_dump(), "run_id": run_of.get(f.id), "batch_id": proposed_in.get(f.id),
                 "review_note": notes.get(f.id), "attribution_flag": flags.get(f.id)}
                for f in load_records(store, Finding)]
    # Findings whose company is not yet established are shipped and labeled, but stay out of the per-company views.
    live = [f for f in findings if f["review_state"] != "rejected" and f["context_id"] is not None]
    cells: dict[str, list[str]] = {}
    for f in live:
        cells.setdefault(f"{f['context_id']}|{f['kind']}", []).append(f["id"])
    vendor_contexts: dict[tuple[str, str], list[str]] = {}
    for f in live:
        if f["kind"] == "vendor_relationship":
            key = (f["vendor"] or UNNAMED_VENDOR, f["relationship"])
            if f["context_id"] not in vendor_contexts.setdefault(key, []):
                vendor_contexts[key].append(f["context_id"])
    per_kind: dict[str, dict[str, int]] = {c["id"]: {} for c in contexts}
    for f in live:
        per_kind[f["context_id"]][f["kind"]] = per_kind[f["context_id"]].get(f["kind"], 0) + 1
    progress = {state: sum(f["review_state"] == state for f in findings) for state in STATES}
    bundle = {
        "bundle_version": "1",
        "versions": {"parser": PARSER_VERSION, "contract": CONTRACT_VERSION, "dashboard": DASHBOARD_VERSION},
        "framing": {**FRAMING, "review_summary": progress, "state_labels": STATE_LABELS},
        "documents": documents,
        "sections": sections,
        "passages": passages,
        "contexts": contexts,
        "findings": findings,
        "matrix": {"rows": [c["id"] for c in contexts], "columns": KINDS, "cells": cells},
        "counts": {
            "contexts_per_vendor_relationship": [
                {"vendor": vendor, "relationship": relationship, "context_ids": ids}
                for (vendor, relationship), ids in sorted(vendor_contexts.items())],
            "findings_per_kind_per_context": per_kind,
            "evidence_type_mix": dict(sorted(Counter(f["evidence_type"] for f in live).items())),
            "review_progress": progress,
        },
        "runs": [{"id": r.id, "model": r.model, "prompt_version": r.prompt_version,
                  "contract_version": r.contract_version,
                  "batches": [o.model_dump(exclude={"response", "input_passage_ids"}) for o in r.batches]}
                 for r in runs],
        "questions": [{**question.model_dump(), "answer": next(
            (a.model_dump() for a in answers if a.question_id == question.id), None)} for question in QUESTIONS],
    }
    bundle["store_sha256"] = store_fingerprint(store)
    bundle["fingerprint"] = fingerprint(bundle)
    bundle["built"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    bundle["check"] = {"status": "ok"}
    check_bundle(bundle, transcripts, store)
    return bundle


def check_bundle(bundle: dict, transcripts: sqlite3.Connection, store: sqlite3.Connection | None = None
                 ) -> tuple[int, int, int]:
    """Every shipped passage must re-render identically at the bundle's recorded fingerprints, and every ID a
    finding, context, or answer cites must be a shipped passage. Given the findings store, the bundle must also show
    its current records and review notes. Returns (documents, passages, findings)."""
    if store is not None and bundle.get("store_sha256") != store_fingerprint(store):
        raise ValueError("bundle is behind the findings store; run dashboard.py --build")
    expected = {document_id: entry["extraction_sha256"] for document_id, entry in bundle["documents"].items()}
    shipped = {p["id"]: p for p in bundle["passages"]}
    try:
        rows = render_passages(transcripts, list(shipped), expected_fingerprints=expected)
    except ValueError as error:
        raise ValueError(f"bundle is stale against the transcripts database: {error}") from error
    mismatched = [row["id"] for row in rows if any(
        row[key] != shipped[row["id"]][key] for key in ("text", "speaker_label", "timestamp_raw", "citation_id"))]
    if mismatched:
        raise ValueError(f"bundle passages differ from the stored source: {', '.join(mismatched)}")
    missing = sorted({i for record in bundle["findings"] + bundle["contexts"]
                      for i in record["supporting"] + record.get("qualifying", []) + record.get("context", [])
                      if i not in shipped})
    if missing:
        raise ValueError(f"records cite passages the bundle does not ship: {', '.join(missing)}")
    citations = {p["citation_id"] for p in bundle["passages"]}
    dangling = sorted({c for question in bundle["questions"] if question["answer"]
                       for c in question["answer"]["citation_ids"] + question["answer"]["citations"]
                       if c not in citations})
    if dangling:
        raise ValueError(f"answers cite passages the bundle does not ship: {', '.join(dangling)}")
    return len(bundle["documents"]), len(shipped), len(bundle["findings"])


def main() -> int:
    command = argparse.ArgumentParser(description=__doc__)
    command.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    command.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    command.add_argument("--findings", type=Path, default=DEFAULT_FINDINGS)
    command.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    action = command.add_mutually_exclusive_group(required=True)
    action.add_argument("--build", action="store_true", help="Write the dashboard bundle after every integrity check")
    action.add_argument("--check", action="store_true", help="Re-check an existing bundle against the transcripts")
    args = command.parse_args()
    try:
        corpus, _ = run(args.manifest, args.database, check=True)
        with closing(open_database(args.database, readonly=True)) as transcripts:
            if args.build:
                with closing(open_findings(args.findings, readonly=True)) as store:
                    check_findings(store, transcripts)
                    answers = [fallback_answer(q, select_evidence(transcripts, store, q)) for q in QUESTIONS]
                    bundle = build_bundle(transcripts, store, corpus, answers=answers)
                args.bundle.parent.mkdir(parents=True, exist_ok=True)
                args.bundle.write_text(json.dumps(bundle, ensure_ascii=False, sort_keys=True), encoding="utf-8")
                print(f"Wrote {args.bundle} ({args.bundle.stat().st_size // 1024} KB): "
                      f"{len(bundle['passages'])} passages, {len(bundle['contexts'])} contexts, "
                      f"{len(bundle['findings'])} findings, {len(bundle['questions'])} questions; "
                      f"review {bundle['framing']['review_summary']}")
            else:
                if not args.bundle.is_file():
                    raise ValueError(f"no bundle at {args.bundle}; run --build first")
                bundle = json.loads(args.bundle.read_text(encoding="utf-8"))
                with closing(open_findings(args.findings, readonly=True)) as store:
                    documents, passages, findings = check_bundle(bundle, transcripts, store)
                print(f"Verified {args.bundle}: {documents} documents, {passages} passages, {findings} findings "
                      f"match the transcripts database and the findings store")
    except (OSError, ValueError, KeyError, zipfile.BadZipFile, ET.ParseError, sqlite3.Error) as error:
        command.exit(1, f"Dashboard failed: {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
