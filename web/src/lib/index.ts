import type { Bundle, Context, Finding, Passage } from "../types";

export interface Index {
  passages: Map<string, Passage>;
  byCitation: Map<string, Passage>;
  contexts: Map<string, Context>;
  findings: Map<string, Finding>;
  bySection: Map<string, Passage[]>;
  citing: Map<string, string[]>;
}

export function buildIndex(bundle: Bundle): Index {
  const passages = new Map(bundle.passages.map((p) => [p.id, p]));
  const byCitation = new Map<string, Passage>();
  const bySection = new Map<string, Passage[]>();
  for (const passage of bundle.passages) {
    if (passage.citation_id) byCitation.set(passage.citation_id, passage);
    if (passage.kind === "text") {
      const key = passage.section_id ?? `${passage.document_id}:preamble`;
      bySection.set(key, [...(bySection.get(key) ?? []), passage]);
    }
  }
  const citing = new Map<string, string[]>();
  for (const finding of bundle.findings) {
    for (const id of [...finding.supporting, ...finding.qualifying, ...finding.context]) {
      citing.set(id, [...(citing.get(id) ?? []), finding.id]);
    }
  }
  return {
    passages,
    byCitation,
    contexts: new Map(bundle.contexts.map((c) => [c.id, c])),
    findings: new Map(bundle.findings.map((f) => [f.id, f])),
    bySection,
    citing,
  };
}

/** Text passages around one passage inside its own section, never across a heading. */
export function neighbours(index: Index, passage: Passage, span = 2): { before: Passage[]; after: Passage[] } {
  const section = index.bySection.get(passage.section_id ?? `${passage.document_id}:preamble`) ?? [];
  const at = section.findIndex((p) => p.id === passage.id);
  if (at < 0) return { before: [], after: [] };
  return { before: section.slice(Math.max(0, at - span), at), after: section.slice(at + 1, at + 1 + span) };
}

export type CitationPart = { type: "text"; value: string } | { type: "cite"; value: string; passage: Passage | null };

const CITATION = /\bE[1-9]\d*:P\d{3}\b/g;

/** Split prose into text and citation tokens; a citation the bundle does not hold resolves to null. */
export function citationParts(text: string, index: Index): CitationPart[] {
  const parts: CitationPart[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: "text", value: text.slice(last, start) });
    parts.push({ type: "cite", value: match[0], passage: index.byCitation.get(match[0]) ?? null });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}
