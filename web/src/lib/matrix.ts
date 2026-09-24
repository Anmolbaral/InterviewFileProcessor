import type { Bundle, Context, Finding, Kind, Passage, ReviewState } from "../types";
import type { Index } from "./index";
import { EMPLOYMENT_LABELS, RELATIONSHIP_LABELS, RELATIONSHIP_ORDER, evidenceLabel, formatQuantity } from "./format";

export const INHOUSE = "In-house / custom";

export const STATUS_WORD: Record<ReviewState, string> = { proposed: "Unreviewed", reviewed: "Reviewed", edited: "Analyst-edited", rejected: "Rejected" };

export interface Dimension { kind: Kind; title: string; hint: string }

/** Matrix rows. "Footprint" counts company contexts, never market share. */
export const DIMENSIONS: Dimension[] = [
  { kind: "vendor_relationship", title: "Footprint in these interviews", hint: "Who deployed, previously used, evaluated, or only considered it. Company contexts, not market share." },
  { kind: "selection_criteria", title: "Why chosen or rejected", hint: "Stated criteria and the decisive reason, as the expert gave them." },
  { kind: "pricing", title: "Pricing and TCO", hint: "Figures in the expert's own units. A quote is not a paid price." },
  { kind: "implementation", title: "Implementation reality", hint: "Durations, effort, and surprises as reported." },
];

/** Column key: the vendor family (first word), so "BMC" and "BMC Helix" share a column; no vendor means in-house. */
export function vendorOf(finding: Finding): string {
  if (!finding.vendor) return INHOUSE;
  return finding.vendor.trim().split(/\s+/)[0];
}

/** Findings with a vendor, or vendor relationships; company-level statements are read per case instead. */
export function matrixFindings(findings: Finding[]): Finding[] {
  return findings.filter((f) => f.vendor !== null || f.kind === "vendor_relationship");
}

/** Vendors as columns, most deployed first, then most discussed, then by name. */
export function vendorColumns(findings: Finding[]): string[] {
  const kinds = new Set(DIMENSIONS.map((d) => d.kind));
  const deployed = new Map<string, Set<string>>();
  const total = new Map<string, number>();
  for (const f of findings) {
    if (!kinds.has(f.kind)) continue;
    const vendor = vendorOf(f);
    total.set(vendor, (total.get(vendor) ?? 0) + 1);
    if (f.kind === "vendor_relationship" && f.relationship === "deployed" && f.context_id !== null) {
      deployed.set(vendor, new Set([...(deployed.get(vendor) ?? []), f.context_id]));
    }
  }
  return [...total.keys()].sort((a, b) =>
    (deployed.get(b)?.size ?? 0) - (deployed.get(a)?.size ?? 0) || (total.get(b) ?? 0) - (total.get(a) ?? 0) || a.localeCompare(b));
}

/** Main columns: vendors deployed somewhere or discussed by two contexts, decided on the unfiltered set. */
export function splitColumns(all: Finding[], vendors: string[]): { main: string[]; minor: string[] } {
  const contexts = new Map<string, Set<string>>();
  const deployed = new Set<string>();
  for (const f of all) {
    const vendor = vendorOf(f);
    if (f.context_id === null) continue;
    contexts.set(vendor, new Set([...(contexts.get(vendor) ?? []), f.context_id]));
    if (f.kind === "vendor_relationship" && f.relationship === "deployed") deployed.add(vendor);
  }
  const isMain = (v: string) => deployed.has(v) || (contexts.get(v)?.size ?? 0) >= 2;
  return { main: vendors.filter(isMain), minor: vendors.filter((v) => !isMain(v)) };
}

export type EmptyReason = "No finding in this view" | "Not yet processed" | "No extracted observation";

/** Why a cell is empty: filtered out, sections unprocessed, or nothing extracted. Never "no evidence exists". */
export function emptyReason(unfilteredCell: Finding[], unprocessed: boolean): EmptyReason {
  if (unfilteredCell.length) return "No finding in this view";
  return unprocessed ? "Not yet processed" : "No extracted observation";
}

/** Section batches of the included interviews that have no completed outcome in any run. */
export function unprocessedBatches(bundle: Bundle, included: Set<string>): string[] {
  const expected = new Set<string>();
  for (const documentId of included) {
    expected.add(`${documentId}:S00`);
    for (const section of Object.values(bundle.sections)) if (section.document_id === documentId && section.batch_id) expected.add(section.batch_id);
  }
  const completed = new Set<string>();
  for (const run of bundle.runs) for (const outcome of run.batches) if (outcome.status !== "failed") completed.add(outcome.batch_id);
  return [...expected].filter((id) => !completed.has(id)).sort();
}

export function cellFindings(findings: Finding[], vendor: string, kind: Kind): Finding[] {
  return findings.filter((f) => f.kind === kind && vendorOf(f) === vendor);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface Summary { text: string; total: number; reviewed: number }

/** Footprint cells list companies per relationship; other cells lead with a reviewed statement when one exists. */
export function cellSummary(cell: Finding[], kind: Kind, index: Index): Summary {
  const reviewed = cell.filter((f) => f.review_state === "reviewed" || f.review_state === "edited");
  const base = { total: cell.length, reviewed: reviewed.length };
  if (!cell.length) return { text: "", ...base };
  if (kind === "vendor_relationship") {
    const text = RELATIONSHIP_ORDER.map((r) => {
      const names = [...new Set(cell.filter((f) => f.relationship === r).map((f) => {
        const held = contextOf(f, index);
        const company = held ? companyName(held) : f.context_id ?? NOT_ESTABLISHED;
        return f.vendor === null ? `${company} (in-house)` : company;
      }))];
      return names.length ? `${RELATIONSHIP_LABELS[r]}: ${names.join(", ")}` : null;
    }).filter(Boolean).join(" · ");
    return { text, ...base };
  }
  // A disputed or unestablished company never leads: the cell's headline would put a claim on the wrong company.
  const trusted = cell.filter((f) => attributionNote(f) === null);
  const lead = trusted.find((f) => f.review_state === "reviewed" || f.review_state === "edited") ?? trusted[0];
  if (!lead) return { text: "No lead statement: company attribution needs review", ...base };
  return { text: truncate(lead.statement, 120) + (cell.length > 1 ? ` +${cell.length - 1} more` : ""), ...base };
}

/** The expert's role line from the transcript header, without the bare "Expert N" line. */
export function roleLine(bundle: Bundle, index: Index, documentId: string): string {
  const lines = (bundle.documents[documentId]?.profile_passage_ids ?? [])
    .flatMap((id) => (index.passages.get(id)?.text ?? "").split(/\r?\n/))
    .map((l) => l.trim())
    .filter((l) => l && !/^Expert \d+$/.test(l));
  return lines.join(" · ");
}

/** Company name with its first alias, the name the expert used. */
export function companyName(context: Context): string {
  return context.aliases.length ? `${context.company_name} (${context.aliases[0]})` : context.company_name;
}

export function companyLine(context: Context | undefined, fallback: string): string {
  return context ? `${companyName(context)} · ${EMPLOYMENT_LABELS[context.employment]}` : fallback;
}

export const NOT_ESTABLISHED = "Company not established";

export function contextOf(finding: Finding, index: Index): Context | undefined {
  return finding.context_id ? index.contexts.get(finding.context_id) : undefined;
}

/** Why a finding's company needs review, or null: the anchor check disputes it, or no passage established it. */
export function attributionNote(finding: Finding): string | null {
  if (finding.attribution_flag) return `Company attribution disputed by check: ${finding.attribution_flag}`;
  return finding.context_id === null ? `${NOT_ESTABLISHED} in the cited passages; needs review` : null;
}

export function citationsOf(finding: Finding, index: Index): string[] {
  return [...finding.supporting, ...finding.qualifying].map((id) => index.passages.get(id)?.citation_id ?? id);
}

/** Clipboard bullet: statement plus company, source, citations, qualifications, and review status. */
export function bulletText(finding: Finding, bundle: Bundle, index: Index): string {
  const quantity = finding.quantity ? ` [${formatQuantity(finding.quantity, finding.kind)}]` : "";
  const qualifications = finding.qualifications.length ? ` Qualified: ${finding.qualifications.join(" ")}` : "";
  const attribution = finding.attribution_flag ? "; company attribution disputed by check" : "";
  return `• ${finding.statement}${quantity}${qualifications} (${companyLine(contextOf(finding, index), finding.context_id ?? NOT_ESTABLISHED)}; ${bundle.documents[finding.document_id]?.label ?? finding.document_id}; ${citationsOf(finding, index).join(", ")}; ${evidenceLabel(finding.evidence_type).toLowerCase()}; ${STATUS_WORD[finding.review_state].toLowerCase()}${attribution})`;
}

/** Which company a passage describes, so a former employer is never read as the current one. */
export function speakingAbout(contexts: (Context | undefined)[]): string {
  const named = [...new Map(contexts.filter((c): c is Context => Boolean(c)).map((c) => [c.id, c])).values()];
  return named.map((c) => `${companyName(c)} (${EMPLOYMENT_LABELS[c.employment]})`).join("; ");
}

export function quoteText(passage: Passage, bundle: Bundle, index: Index, contexts: (Context | undefined)[] = []): string {
  const who = passage.speaker_label ?? "unattributed";
  const about = speakingAbout(contexts);
  const role = roleLine(bundle, index, passage.document_id);
  return `"${passage.text}" — ${who}${about ? `, speaking about ${about}` : ""}${role ? `; current role: ${role}` : ""} (${passage.citation_id ?? passage.id}${passage.timestamp_raw ? `, ${passage.timestamp_raw}` : ""})`;
}

export function scaleLines(findings: Finding[], contextId: string): string[] {
  return findings.filter((f) => f.kind === "company_scale" && f.context_id === contextId).map((f) => f.statement);
}

export interface Quote { passage: Passage; role: "supports" | "qualifies"; findingIds: string[] }

/** Every supporting and qualifying passage behind a cell, once each, in source order. */
export function quotesFor(cell: Finding[], index: Index): Quote[] {
  const seen = new Map<string, Quote>();
  for (const f of cell) {
    for (const [role, ids] of [["supports", f.supporting], ["qualifies", f.qualifying]] as const) {
      for (const id of ids) {
        const passage = index.passages.get(id);
        if (!passage) continue;
        const existing = seen.get(id);
        if (existing) { existing.findingIds.push(f.id); if (role === "supports") existing.role = "supports"; }
        else seen.set(id, { passage, role, findingIds: [f.id] });
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.passage.document_id.localeCompare(b.passage.document_id) || a.passage.paragraph_index - b.passage.paragraph_index);
}

export interface CaseSummary {
  context: Context;
  platforms: string[];
  previously: string[];
  reasons: Finding[];
  scale: string[];
  total: number;
  reviewed: number;
}

/** Primary cases are company contexts where the expert reports a deployed platform; the rest are background. */
export function primaryCases(contexts: Context[], findings: Finding[]): { primary: Context[]; background: Context[] } {
  const live = contexts.filter((c) => c.review_state !== "rejected");
  const deployed = new Set(findings.filter((f) => f.kind === "vendor_relationship" && f.relationship === "deployed").map((f) => f.context_id));
  return { primary: live.filter((c) => deployed.has(c.id)), background: live.filter((c) => !deployed.has(c.id)) };
}

/** One case card's content, reviewed statements first, nothing invented: platform and reasons come from findings. */
export function caseSummary(context: Context, findings: Finding[]): CaseSummary {
  const own = findings.filter((f) => f.context_id === context.id && f.review_state !== "rejected");
  const byReview = (a: Finding, b: Finding) => Number(b.review_state !== "proposed") - Number(a.review_state !== "proposed");
  const relationships = own.filter((f) => f.kind === "vendor_relationship");
  const names = (list: Finding[]) => [...new Set(list.map((f) => f.vendor ?? INHOUSE))];
  return {
    context,
    platforms: names(relationships.filter((f) => f.relationship === "deployed")),
    previously: names(relationships.filter((f) => f.relationship === "previously_used")),
    reasons: own.filter((f) => f.kind === "selection_criteria").sort(byReview),
    scale: own.filter((f) => f.kind === "company_scale").map((f) => f.statement),
    total: own.length,
    reviewed: own.filter((f) => f.review_state !== "proposed").length,
  };
}

export const CASE_SECTIONS: { kind: Kind; title: string }[] = [
  { kind: "vendor_relationship", title: "Platform and footprint" },
  { kind: "selection_criteria", title: "Why chosen or rejected" },
  { kind: "pricing", title: "Pricing and TCO" },
  { kind: "implementation", title: "Implementation" },
  { kind: "rating", title: "Ratings and likelihood" },
  { kind: "company_scale", title: "Company scale" },
];
