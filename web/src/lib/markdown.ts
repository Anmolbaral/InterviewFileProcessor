import type { Bundle, Finding, Passage } from "../types";
import type { Index } from "./index";
import { NOT_ESTABLISHED, attributionNote, contextOf } from "./matrix";
import { EMPLOYMENT_LABELS, KIND_LABELS, evidenceLabel, formatQuantity, relationshipLabel, stateLabel, vendorLabel } from "./format";

function quote(passage: Passage): string {
  const speaker = passage.speaker_label ?? "unattributed";
  const time = passage.timestamp_raw ? ` ${passage.timestamp_raw}` : "";
  return `> [${passage.citation_id ?? passage.id}] ${speaker}${time}: ${passage.text.replace(/\n/g, "\n> ")}`;
}

/** One finding with its sources, or null when a cited passage is missing from the bundle. */
export function findingMarkdown(bundle: Bundle, index: Index, finding: Finding): string | null {
  const roles: [string, string[]][] = [["Context", finding.context], ["Supporting", finding.supporting], ["Qualifying", finding.qualifying]];
  const resolved = roles.map(([label, ids]) => ({ label, list: ids.map((id) => index.passages.get(id) ?? null) }));
  if (resolved.some((r) => r.list.some((p) => p === null))) return null;
  const context = contextOf(finding, index);
  const attribution = attributionNote(finding);
  const lines = [
    `### ${finding.statement}`,
    `- Company context: ${context ? `${context.company_name} (${EMPLOYMENT_LABELS[context.employment]})` : finding.context_id ?? NOT_ESTABLISHED}`,
    ...(attribution ? [`- Attribution: ${attribution}`] : []),
    `- Kind: ${KIND_LABELS[finding.kind]} · Vendor: ${vendorLabel(finding.vendor)} · Relationship: ${relationshipLabel(finding.relationship)}`,
    `- Evidence type: ${evidenceLabel(finding.evidence_type)} · Origin: ${finding.origin} · Review state: ${stateLabel(finding.review_state, bundle.framing.state_labels)}`,
  ];
  if (finding.quantity) lines.push(`- Quantity: ${formatQuantity(finding.quantity, finding.kind)}`);
  for (const q of finding.qualifications) lines.push(`- Qualification: ${q}`);
  const document = bundle.documents[finding.document_id];
  for (const { label, list } of resolved) {
    if (!list.length) continue;
    lines.push("", `${label} passages (${document.label}, ${document.source_filename}):`);
    for (const passage of list as Passage[]) {
      const section = passage.section_id ? bundle.sections[passage.section_id]?.heading : "before the first heading";
      lines.push(quote(passage), `> — ${section}`, "");
    }
  }
  return lines.join("\n");
}

export interface ExportInput { bundle: Bundle; index: Index; selection: string[]; conclusion: string }

/** A Markdown brief that carries every fact's units, citations, quoted passages, source files, and caveats. */
export function buildMarkdown({ bundle, index, selection, conclusion }: ExportInput): string {
  const findings = selection.map((id) => index.findings.get(id)).filter((f): f is Finding => Boolean(f));
  const byContext = new Map<string | null, Finding[]>();
  for (const finding of findings) byContext.set(finding.context_id, [...(byContext.get(finding.context_id) ?? []), finding]);
  const out: string[] = [
    `# ${bundle.framing.title}: selected findings`,
    "",
    `**Client question.** ${bundle.framing.client_question}`,
    "",
    `**What the evidence cannot establish.** ${bundle.framing.market_share_unestimated}`,
    "",
    "## Conclusion (analyst draft, not reviewed evidence)",
    "",
    conclusion.trim() || "_No conclusion written._",
    "",
    "## Selected findings",
  ];
  const excluded: string[] = [];
  for (const [contextId, list] of byContext) {
    const context = contextId ? index.contexts.get(contextId) : undefined;
    out.push("", `## ${context ? `${context.company_name} · ${EMPLOYMENT_LABELS[context.employment]}` : contextId ?? NOT_ESTABLISHED}`);
    if (context?.aliases.length) out.push(`Also referred to as: ${context.aliases.join(", ")}`);
    for (const finding of list) {
      const text = findingMarkdown(bundle, index, finding);
      if (text === null) excluded.push(finding.id);
      else out.push("", text);
    }
  }
  if (!findings.length) out.push("", "_No findings selected._");
  if (excluded.length) out.push("", `Excluded because a cited passage did not resolve in this bundle: ${excluded.join(", ")}`);
  out.push("", "## Caveats", "", ...bundle.framing.caveats.map((c) => `- ${c}`));
  const generated = bundle.questions.filter((q) => q.answer?.status === "generated").map((q) => `${q.answer!.model} (prompt ${q.answer!.prompt_version})`);
  out.push("", "## Provenance", "",
    `- Bundle ${bundle.fingerprint.slice(0, 12)} built ${bundle.built}; parser ${bundle.versions.parser}, contract ${bundle.versions.contract}.`,
    ...Object.values(bundle.documents).map((d) => `- ${d.label}: ${d.source_filename} (sha256 ${d.source_sha256.slice(0, 12)}…)`),
    generated.length ? `- Generated answers in the dashboard came from: ${[...new Set(generated)].join("; ")}.` : "- No generated text is included in this export.");
  return out.join("\n") + "\n";
}
