import { describe, expect, it } from "vitest";
import type { Bundle, Finding, Passage } from "../types";
import { formatQuantity } from "./format";
import { buildIndex, citationParts, neighbours } from "./index";
import { buildMarkdown } from "./markdown";

const passage = (id: string, citation: string, index: number, text: string, section: string | null = "E1:B0002"): Passage => ({
  id, document_id: "E1", citation_id: citation, paragraph_index: index, kind: "text", section_id: section, chunk_id: null,
  speaker_label: "Expert 1", timestamp_raw: "00:01:10", text,
});

const finding: Finding = {
  id: "E1:F001", document_id: "E1", context_id: "E1:C01", kind: "pricing", vendor: "Acme Desk", relationship: "deployed",
  statement: "Roughly forty dollars per agent per month.", evidence_type: "expert_estimate",
  quantity: { raw: "roughly forty dollars per agent per month", value: 40, low: null, high: null, approximate: true, unit: "per agent", period: "month", currency: "dollars", basis: "current tier", carried: [] },
  qualifications: ["A later passage adds a module cost."], supporting: ["E1:B0011"], qualifying: ["E1:B0015"], context: ["E1:B0006"],
  origin: "model", review_state: "proposed", source_sha256: "a".repeat(64), extraction_sha256: "b".repeat(64), run_id: "r", batch_id: "E1:S02", review_note: null,
  attribution_flag: null,
};

const bundle: Bundle = {
  bundle_version: "1", built: "2026-09-23T00:00:00+00:00", fingerprint: "c".repeat(64), store_sha256: "d".repeat(64), check: { status: "ok" },
  versions: { parser: "1.1.0", contract: "1.0.0", dashboard: "1.0.0" },
  framing: { title: "Analytics Dashboard", client_question: "Market share?", scope: "", market_share_unestimated: "Not estimable.", caveats: ["Prices keep their units."],
    review_summary: { proposed: 1, reviewed: 0, edited: 0, rejected: 0 },
    state_labels: { proposed: "Model proposal, unreviewed", reviewed: "Reviewed", edited: "Edited", rejected: "Rejected" } },
  documents: { E1: { label: "Expert 1", source_filename: "one.docx", source_sha256: "a".repeat(64), extraction_sha256: "b".repeat(64), coverage: "supported_text", warnings: [], profile_passage_ids: [] } },
  sections: { "E1:B0002": { document_id: "E1", heading: "Cost", citation_id: "E1:P002", batch_id: "E1:S01" } },
  passages: [passage("E1:B0006", "E1:P006", 6, "I lead IT at Acme."), passage("E1:B0009", "E1:P009", 9, "What do you pay?"),
    passage("E1:B0011", "E1:P011", 11, "Roughly forty dollars per agent per month."), passage("E1:B0013", "E1:P013", 13, "Any surprises?"),
    passage("E1:B0015", "E1:P015", 15, "That was testing access, not extra environments.")],
  contexts: [{ id: "E1:C01", document_id: "E1", company_name: "Acme", aliases: ["ACME Corp"], employment: "current", note: null, supporting: ["E1:B0006"], qualifying: [], context: [],
    origin: "model", review_state: "proposed", source_sha256: "a".repeat(64), extraction_sha256: "b".repeat(64), run_id: "r", batch_id: "E1:S01", review_note: null }],
  findings: [finding, { ...finding, id: "E1:F002", supporting: ["E1:B0999"] }],
  matrix: { rows: ["E1:C01"], columns: ["company_scale", "vendor_relationship", "selection_criteria", "pricing", "implementation"], cells: { "E1:C01|pricing": ["E1:F001", "E1:F002"] } },
  counts: { contexts_per_vendor_relationship: [], findings_per_kind_per_context: {}, evidence_type_mix: {}, review_progress: { proposed: 2, reviewed: 0, edited: 0, rejected: 0 } },
  runs: [], questions: [],
};

describe("formatQuantity", () => {
  it("keeps the source's wording and never invents a midpoint", () => {
    expect(formatQuantity(finding.quantity, "pricing")).toBe("“roughly forty dollars per agent per month” · approx. 40 dollars per agent per month (current tier)");
    expect(formatQuantity({ ...finding.quantity!, value: null, low: 150, approximate: false, basis: null }, "pricing")).toContain("more than 150");
    expect(formatQuantity({ ...finding.quantity!, value: null, low: 6, high: 8, unit: "percent", period: null, currency: null, basis: null }, "pricing")).toContain("6–8 percent");
    expect(formatQuantity(null, "pricing")).toBe("No figure stated");
    expect(formatQuantity(null, "implementation")).toBe("");
    expect(formatQuantity({ ...finding.quantity!, raw: "north of one-fifty", value: null, low: 150, approximate: false, basis: null, carried: ["currency", "unit", "period"] }, "pricing"))
      .toBe("“north of one-fifty” · more than 150 dollars per agent per month · currency, unit, period taken from the same answer");
  });
});

describe("index", () => {
  const index = buildIndex(bundle);
  it("resolves citations and flags unknown ones", () => {
    const parts = citationParts("Price is E1:P011, see E1:P999.", index);
    expect(parts.map((p) => p.type)).toEqual(["text", "cite", "text", "cite", "text"]);
    expect(parts[1]).toMatchObject({ value: "E1:P011", passage: { id: "E1:B0011" } });
    expect(parts[3]).toMatchObject({ value: "E1:P999", passage: null });
  });
  it("finds neighbours only inside the section", () => {
    const around = neighbours(index, index.passages.get("E1:B0011")!, 1);
    expect(around.before.map((p) => p.id)).toEqual(["E1:B0009"]);
    expect(around.after.map((p) => p.id)).toEqual(["E1:B0013"]);
  });
});

describe("buildMarkdown", () => {
  it("carries units, citations, quotes, labels, and caveats, and excludes unresolved findings", () => {
    const text = buildMarkdown({ bundle, index: buildIndex(bundle), selection: ["E1:F001", "E1:F002"], conclusion: "Draft." });
    for (const expected of ["Draft.", "Acme · current employer", "Also referred to as: ACME Corp", "approx. 40 dollars per agent per month",
      "> [E1:P011] Expert 1 00:01:10: Roughly forty dollars per agent per month.", "Qualifying passages", "Model proposal, unreviewed",
      "Prices keep their units.", "one.docx", "Excluded because a cited passage did not resolve in this bundle: E1:F002", "No generated text"]) {
      expect(text).toContain(expected);
    }
  });
});

import { bulletText, caseSummary, cellFindings, cellSummary, emptyReason, matrixFindings, primaryCases, quoteText, quotesFor, roleLine, splitColumns, unprocessedBatches, vendorColumns, vendorOf } from "./matrix";

describe("matrix", () => {
  const index = buildIndex(bundle);
  const relationship: Finding = { ...finding, id: "E1:F003", kind: "vendor_relationship", relationship: "deployed", quantity: null, qualifying: [] };
  const inhouse: Finding = { ...relationship, id: "E1:F004", vendor: null, relationship: "previously_used", statement: "A custom system was used before." };
  const criteria: Finding = { ...finding, id: "E1:F005", kind: "selection_criteria", vendor: null, relationship: null, quantity: null, statement: "Integration ranked first." };
  it("keeps company-level statements out of the vendor matrix and gives in-house systems a column", () => {
    expect(matrixFindings([finding, relationship, inhouse, criteria]).map((f) => f.id)).toEqual(["E1:F001", "E1:F003", "E1:F004"]);
    expect(vendorColumns([finding, relationship, inhouse])).toEqual(["Acme", "In-house / custom"]);
    expect(vendorOf({ ...finding, vendor: "BMC Helix ITSM" })).toBe("BMC");
    expect(cellSummary(cellFindings([inhouse], "In-house / custom", "vendor_relationship"), "vendor_relationship", index).text).toBe("Previously used: Acme (ACME Corp) (in-house)");
  });
  it("decides main columns on deployment or breadth, not on how many records a filter left", () => {
    const elsewhere: Finding = { ...relationship, id: "E2:F001", document_id: "E2", context_id: "E2:C01", vendor: "Zed", relationship: "evaluated" };
    const again: Finding = { ...elsewhere, id: "E2:F002", context_id: "E2:C02" };
    expect(splitColumns([finding, relationship, elsewhere, again], ["Acme", "Zed"])).toEqual({ main: ["Acme", "Zed"], minor: [] });
    expect(splitColumns([finding, elsewhere], ["Acme", "Zed"])).toEqual({ main: [], minor: ["Acme", "Zed"] });
  });
  it("leads with a reviewed statement and counts review status", () => {
    const reviewed: Finding = { ...finding, id: "E1:F009", review_state: "reviewed", statement: "The reviewed one." };
    expect(cellSummary([finding, reviewed], "pricing", index)).toEqual({ text: "The reviewed one. +1 more", total: 2, reviewed: 1 });
    expect(cellSummary([finding], "pricing", index)).toEqual({ text: "Roughly forty dollars per agent per month.", total: 1, reviewed: 0 });
  });
  it("names the real reason a cell is empty", () => {
    expect(emptyReason([finding], false)).toBe("No finding in this view");
    expect(emptyReason([], true)).toBe("Not yet processed");
    expect(emptyReason([], false)).toBe("No extracted observation");
    expect(unprocessedBatches(bundle, new Set(["E1"]))).toEqual(["E1:S00", "E1:S01"]);
    const processed = { ...bundle, runs: [{ id: "r", model: "m", prompt_version: "1", contract_version: "1", batches: [
      { batch_id: "E1:S00", status: "no_findings" as const, input_fingerprint: "0".repeat(64), finding_ids: [], context_ids: [], rejected: [], error: null },
      { batch_id: "E1:S01", status: "failed" as const, input_fingerprint: "0".repeat(64), finding_ids: [], context_ids: [], rejected: [], error: "timeout" }] }] };
    expect(unprocessedBatches(processed, new Set(["E1"]))).toEqual(["E1:S01"]);
  });
  it("copies status, qualifications, and who the speaker is describing", () => {
    const text = bulletText({ ...finding, review_state: "reviewed" }, bundle, index);
    for (const part of ["• Roughly forty dollars per agent per month.", "Acme (ACME Corp) · current employer", "Expert 1", "E1:P011, E1:P015", "Qualified: A later passage adds a module cost.", "reviewed)"]) expect(text).toContain(part);
    expect(text).not.toContain("unreviewed");
    const quote = quoteText(index.passages.get("E1:B0011")!, bundle, index, [index.contexts.get("E1:C01")]);
    expect(quote).toContain("speaking about Acme (ACME Corp) (current employer)");
    expect(quote).toContain("(E1:P011, 00:01:10)");
  });
  it("lists each quote once in source order with its role", () => {
    const quotes = quotesFor([finding, { ...finding, id: "y", supporting: ["E1:B0015"], qualifying: [] }], index);
    expect(quotes.map((q) => [q.passage.id, q.role])).toEqual([["E1:B0011", "supports"], ["E1:B0015", "supports"]]);
    expect(roleLine(bundle, index, "E1")).toBe("");
  });
});

describe("cases", () => {
  const context = bundle.contexts[0];
  const deployed: Finding = { ...finding, id: "E1:F010", kind: "vendor_relationship", relationship: "deployed", quantity: null };
  const prior: Finding = { ...deployed, id: "E1:F011", vendor: null, relationship: "previously_used" };
  const reason: Finding = { ...finding, id: "E1:F012", kind: "selection_criteria", vendor: null, quantity: null, statement: "Integration ranked first." };
  const checked: Finding = { ...reason, id: "E1:F013", review_state: "reviewed", statement: "Scalability was decisive." };
  const scale: Finding = { ...reason, id: "E1:F014", kind: "company_scale", statement: "About 2,000 sites." };
  it("makes a case of a context with a deployed platform and leaves the rest as background", () => {
    expect(primaryCases([context, { ...context, id: "E1:C09" }], [deployed]).primary.map((c) => c.id)).toEqual(["E1:C01"]);
    expect(primaryCases([context, { ...context, id: "E1:C09" }], [deployed]).background.map((c) => c.id)).toEqual(["E1:C09"]);
  });
  it("summarizes platform, prior system, reviewed-first reasons, scale, and review progress", () => {
    const c = caseSummary(context, [deployed, prior, reason, checked, scale, { ...finding, review_state: "rejected" }]);
    expect(c.platforms).toEqual(["Acme Desk"]);
    expect(c.previously).toEqual(["In-house / custom"]);
    expect(c.reasons.map((f) => f.id)).toEqual(["E1:F013", "E1:F012"]);
    expect(c.scale).toEqual(["About 2,000 sites."]);
    expect([c.total, c.reviewed]).toEqual([5, 1]);
  });
});

describe("company attribution", () => {
  const disputed: Finding = { ...finding, id: "E1:F003", statement: "Filed to the wrong company.", review_state: "reviewed",
    attribution_flag: "filed under Acme, but the most recent explicit company reference before E1:P011 is Globex at E1:P009" };
  const unestablished: Finding = { ...finding, id: "E1:F004", statement: "Company unknown.", context_id: null };
  const withBoth: Bundle = { ...bundle, findings: [...bundle.findings, disputed, unestablished] };
  const index = buildIndex(withBoth);

  it("never leads a cell with a disputed or unestablished finding", () => {
    expect(cellSummary([disputed, unestablished, finding], "pricing", index).text).toContain("Roughly forty dollars");
    expect(cellSummary([disputed, unestablished], "pricing", index).text).toBe("No lead statement: company attribution needs review");
  });
  it("carries the attribution label into copied bullets and the export", () => {
    expect(bulletText(disputed, withBoth, index)).toContain("company attribution disputed by check");
    expect(bulletText(unestablished, withBoth, index)).toContain("Company not established");
    const markdown = buildMarkdown({ bundle: withBoth, index, selection: ["E1:F003", "E1:F004"], conclusion: "" });
    expect(markdown).toContain("- Attribution: Company attribution disputed by check: filed under Acme");
    expect(markdown).toContain("## Company not established");
  });
});
