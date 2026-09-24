"""Bundle, question, and integrity checks for the dashboard data layer. No model calls, no semantic claims."""

import json
import tempfile
import unittest
from pathlib import Path

from dashboard import (QUESTIONS, Answer, CaseSummary, Question, build_bundle, check_bundle, fallback_answer,
                       select_evidence, validate_answer)
from extract import (DEFAULT_FINDINGS, CompanyContext, ExtractionRun, Finding, Quantity, SourceVersion,
                     check_findings, load_records, open_findings, review, save_run)
from parser import DEFAULT_DATABASE, DEFAULT_MANIFEST, open_database, run
from test_extract import write_fixture

MANIFEST = DEFAULT_MANIFEST


class DashboardTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        _, manifest = write_fixture(self.directory, experts=(1, 2))
        database = self.directory / "transcripts.sqlite"
        self.corpus, _ = run(manifest, database)
        self.transcripts = open_database(database, readonly=True)
        self.addCleanup(self.transcripts.close)
        self.store = open_findings(self.directory / "findings.sqlite")
        self.addCleanup(self.store.close)
        versions = {d.id: SourceVersion(source_sha256=d.source_sha256, extraction_sha256=d.extraction_sha256)
                    for d in self.corpus.documents}
        contexts, findings = [], []
        for document, vendor, relationship, state in (("E1", "Acme Desk", "deployed", "reviewed"),
                                                      ("E2", None, "previously_used", "proposed")):
            version = versions[document].model_dump()
            contexts.append(CompanyContext(id=f"{document}:C01", document_id=document, company_name="Acme",
                                           employment="current", supporting=[f"{document}:B0006"], origin="analyst",
                                           **version))
            findings.append(Finding(
                id=f"{document}:F001", document_id=document, context_id=f"{document}:C01", kind="pricing",
                vendor=vendor, relationship=relationship, statement="Roughly forty dollars per agent per month.",
                evidence_type="expert_estimate", review_state=state,
                quantity=Quantity(raw="Roughly forty dollars per agent per month.", value=40.0, approximate=True,
                                  unit="per agent", period="month", currency="dollars"),
                supporting=[f"{document}:B0011"], qualifying=[f"{document}:B0015"], context=[f"{document}:B0006"],
                origin="analyst", **version))
            findings.append(Finding(
                id=f"{document}:F002", document_id=document, context_id=f"{document}:C01", kind="vendor_relationship",
                vendor=vendor, relationship=relationship, statement="The company uses this system.",
                evidence_type="firsthand_report", review_state="rejected" if document == "E2" else "proposed",
                supporting=[f"{document}:B0006"], origin="analyst", **version))
        save_run(self.store, ExtractionRun(id="seed", model="none", prompt_version="analyst-seed",
                                           source_versions=versions), contexts, findings)
        self.answers = [fallback_answer(question, select_evidence(self.transcripts, self.store, question))
                        for question in QUESTIONS]
        self.bundle = build_bundle(self.transcripts, self.store, self.corpus, answers=self.answers)

    def test_bundle_ships_the_corpus_once_and_the_matrix_covers_every_live_finding(self):
        bundle = self.bundle
        passages = bundle["passages"]
        self.assertEqual(len(passages), 2 * (7 + 2))  # text and heading passages of both interviews
        self.assertEqual({p["kind"] for p in passages}, {"text", "heading"})
        self.assertEqual(passages[0]["id"], "E1:B0001")
        self.assertEqual(bundle["sections"]["E1:B0007"]["heading"], "Cost")
        self.assertEqual(bundle["sections"]["E1:B0007"]["batch_id"], "E1:S02")
        self.assertEqual(bundle["documents"]["E2"]["label"], "Expert 2")
        self.assertEqual(bundle["documents"]["E1"]["profile_passage_ids"], ["E1:B0001"])
        self.assertEqual(bundle["matrix"]["rows"], ["E1:C01", "E2:C01"])
        cells = bundle["matrix"]["cells"]
        self.assertEqual(cells["E1:C01|pricing"], ["E1:F001"])
        self.assertEqual(cells["E1:C01|vendor_relationship"], ["E1:F002"])
        self.assertNotIn("E2:C01|vendor_relationship", cells)  # rejected findings leave the matrix
        live = sorted(i for ids in cells.values() for i in ids)
        self.assertEqual(live, ["E1:F001", "E1:F002", "E2:F001"])
        self.assertEqual([f["id"] for f in bundle["findings"]], ["E1:F001", "E1:F002", "E2:F001", "E2:F002"])
        self.assertEqual(bundle["findings"][3]["review_state"], "rejected")  # shipped, labeled, out of the matrix
        self.assertEqual(bundle["findings"][0]["batch_id"], None)  # analyst seed: no batch proposed it
        self.assertEqual(bundle["framing"]["review_summary"], {"proposed": 2, "reviewed": 1, "edited": 0, "rejected": 1})
        self.assertEqual(bundle["framing"]["title"], "Analytics Dashboard")
        self.assertIn("market share", bundle["framing"]["market_share_unestimated"].lower())
        self.assertEqual(len(bundle["fingerprint"]), 64)
        self.assertEqual(bundle["check"], {"status": "ok"})

    def test_bundle_ships_attribution_labels_and_fails_when_behind_the_findings_store(self):
        self.assertEqual(check_bundle(self.bundle, self.transcripts, self.store), (2, 18, 4))
        version = {k: getattr(self.corpus.documents[0], k) for k in ("source_sha256", "extraction_sha256")}
        globex = CompanyContext(id="E1:C02", document_id="E1", company_name="Globex", employment="historical",
                                supporting=["E1:B0006"], origin="analyst", **version)
        base = dict(document_id="E1", kind="pricing", statement="Roughly forty dollars per agent per month.",
                    evidence_type="expert_estimate", supporting=["E1:B0011"], origin="analyst", **version)
        save_run(self.store, ExtractionRun(id="seed-2", model="none", prompt_version="analyst-seed",
                                           source_versions={"E1": SourceVersion(**version)}), [globex],
                 [Finding(id="E1:F003", context_id="E1:C02", **base), Finding(id="E1:F004", context_id=None, **base)])
        with self.assertRaisesRegex(ValueError, "behind the findings store"):
            check_bundle(self.bundle, self.transcripts, self.store)
        bundle = build_bundle(self.transcripts, self.store, self.corpus, answers=[])
        flags = {f["id"]: f["attribution_flag"] for f in bundle["findings"]}
        self.assertIn("Acme", flags["E1:F003"])  # filed to Globex while the conversation is about Acme
        self.assertIsNone(flags["E1:F001"])
        self.assertIsNone(flags["E1:F004"])  # unestablished is its own label, not a dispute
        self.assertNotIn("E1:F004", [i for ids in bundle["matrix"]["cells"].values() for i in ids])
        self.assertNotIn(None, bundle["counts"]["findings_per_kind_per_context"])
        self.assertEqual(check_bundle(bundle, self.transcripts, self.store)[2], 6)
        review(self.store, self.transcripts, "E1:F003", "rejected", note="Filed to the wrong company.")
        with self.assertRaisesRegex(ValueError, "behind the findings store"):
            check_bundle(bundle, self.transcripts, self.store)

    def test_counts_count_company_contexts_never_findings(self):
        counts = self.bundle["counts"]
        self.assertEqual(counts["contexts_per_vendor_relationship"],
                         [{"vendor": "Acme Desk", "relationship": "deployed", "context_ids": ["E1:C01"]}])
        self.assertEqual(counts["findings_per_kind_per_context"]["E1:C01"], {"pricing": 1, "vendor_relationship": 1})
        self.assertEqual(counts["findings_per_kind_per_context"]["E2:C01"], {"pricing": 1})
        self.assertEqual(counts["evidence_type_mix"], {"expert_estimate": 2, "firsthand_report": 1})
        self.assertEqual(counts["review_progress"], {"proposed": 2, "reviewed": 1, "edited": 0, "rejected": 1})

    def test_check_bundle_rejects_tampered_text_or_unknown_citations(self):
        self.assertEqual(check_bundle(self.bundle, self.transcripts), (2, 18, 4))
        tampered = json.loads(json.dumps(self.bundle))
        tampered["passages"][2]["text"] = "Tampered"
        with self.assertRaisesRegex(ValueError, "E1:B0004"):
            check_bundle(tampered, self.transcripts)
        stale = json.loads(json.dumps(self.bundle))
        stale["documents"]["E1"]["extraction_sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "fingerprint"):
            check_bundle(stale, self.transcripts)
        orphan = json.loads(json.dumps(self.bundle))
        orphan["findings"][0]["supporting"] = ["E1:B0999"]
        with self.assertRaisesRegex(ValueError, "E1:B0999"):
            check_bundle(orphan, self.transcripts)

    def test_questions_select_evidence_per_case_and_fall_back_without_prose(self):
        pricing = Question(id="QX", text="What does it cost?", kinds=["pricing"], vendors=["acme"])
        evidence = select_evidence(self.transcripts, self.store, pricing)
        self.assertEqual(evidence.by_context, {"E1:C01": ["E1:F001"], "E2:C01": []})  # E2's vendor is unnamed
        self.assertEqual(evidence.finding_ids, ["E1:F001"])
        self.assertEqual(evidence.citation_ids, ["E1:P006", "E1:P011", "E1:P015"])  # supporting, qualifying, context
        scoped = select_evidence(self.transcripts, self.store, Question(id="QY", text="E2 only?", documents=["E2"]))
        self.assertEqual(list(scoped.by_context), ["E2:C01"])
        self.assertEqual(scoped.finding_ids, ["E2:F001"])  # the rejected E2:F002 is never evidence
        answer = fallback_answer(pricing, evidence)
        self.assertEqual((answer.status, answer.model, answer.answer), ("prepared", "none", None))
        self.assertEqual([(c.context_id, c.finding_ids) for c in answer.per_case], [("E1:C01", ["E1:F001"]), ("E2:C01", [])])
        self.assertTrue(any("E2:C01" in gap for gap in answer.gaps))
        for question in QUESTIONS:
            self.assertTrue(question.text.endswith("?"))
        self.assertEqual(len({q.id for q in QUESTIONS}), len(QUESTIONS))

    def test_generated_answers_are_withheld_when_a_citation_was_not_supplied(self):
        question = Question(id="QX", text="What does it cost?", kinds=["pricing"])
        evidence = select_evidence(self.transcripts, self.store, question)
        good = Answer(question_id="QX", status="generated", model="fake", prompt_version="1.0.0",
                      input_fingerprint="0" * 64, finding_ids=evidence.finding_ids, citation_ids=evidence.citation_ids,
                      by_context=evidence.by_context, answer="Roughly forty dollars per agent per month [E1:P011].",
                      per_case=[CaseSummary(context_id="E1:C01", summary="Priced per agent.", finding_ids=["E1:F001"],
                                            citations=["E1:P011"])], citations=["E1:P011"])
        self.assertEqual(validate_answer(good, evidence, self.transcripts).status, "generated")
        bad = good.model_copy(update={"citations": ["E1:P011", "E1:P002"]})  # the heading was never supplied
        withheld = validate_answer(bad, evidence, self.transcripts)
        self.assertEqual((withheld.status, withheld.answer), ("withheld", None))
        self.assertIn("E1:P002", withheld.error)
        self.assertEqual([c.summary for c in withheld.per_case], [None, None])  # fallback listing, no prose
        self.assertEqual([c.context_id for c in withheld.per_case], ["E1:C01", "E2:C01"])
        foreign = good.model_copy(update={"finding_ids": ["E1:F001", "E2:F002"]})  # a rejected finding
        self.assertEqual(validate_answer(foreign, evidence, self.transcripts).status, "withheld")


@unittest.skipUnless(MANIFEST.is_file(), "Transcript manifest (inputs/manifest.json) is missing; synthetic tests still run.")
class ProvidedTranscriptDashboardTests(unittest.TestCase):
    def test_bundle_from_the_real_stores_passes_its_check(self):
        corpus, _ = run(MANIFEST, DEFAULT_DATABASE, check=True)
        transcripts = open_database(DEFAULT_DATABASE, readonly=True)
        self.addCleanup(transcripts.close)
        store = open_findings(DEFAULT_FINDINGS, readonly=True)
        self.addCleanup(store.close)
        check_findings(store, transcripts)
        answers = [fallback_answer(q, select_evidence(transcripts, store, q)) for q in QUESTIONS]
        bundle = build_bundle(transcripts, store, corpus, answers=answers)
        self.assertEqual(len(bundle["passages"]), 342)
        self.assertEqual(sorted(bundle["documents"]), ["E1", "E2", "E3"])
        self.assertEqual(len(bundle["findings"]), len(load_records(store, Finding)))
        solara = [f for f in bundle["findings"] if f["document_id"] == "E3" and f["kind"] == "pricing"
                  and f["quantity"] and f["quantity"]["value"] == 40.0]
        self.assertTrue(solara, "the Solara pricing proposal must be in the bundle")
        self.assertEqual(solara[0]["quantity"]["unit"], "per agent")
        self.assertEqual(check_bundle(bundle, transcripts)[0], 3)


if __name__ == "__main__":
    unittest.main()
