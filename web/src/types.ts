export type Kind = "company_scale" | "vendor_relationship" | "selection_criteria" | "pricing" | "implementation" | "rating";
export type ReviewState = "proposed" | "reviewed" | "edited" | "rejected";
export type Origin = "model" | "analyst";

export interface Quantity {
  raw: string;
  value: number | null;
  low: number | null;
  high: number | null;
  approximate: boolean;
  unit: string | null;
  period: string | null;
  currency: string | null;
  basis: string | null;
  carried: ("currency" | "unit" | "period")[]; // taken from the same answer, not this figure's own words
}

export interface Passage {
  id: string;
  document_id: string;
  citation_id: string | null;
  paragraph_index: number;
  kind: "text" | "heading";
  section_id: string | null;
  chunk_id: string | null;
  speaker_label: string | null;
  timestamp_raw: string | null;
  text: string;
}

interface Sourced {
  id: string;
  document_id: string;
  supporting: string[];
  qualifying: string[];
  context: string[];
  origin: Origin;
  review_state: ReviewState;
  source_sha256: string;
  extraction_sha256: string;
  run_id: string | null;
  batch_id: string | null;
  review_note: string | null;
}

export interface Context extends Sourced {
  company_name: string;
  aliases: string[];
  employment: "current" | "historical" | "unclear";
  note: string | null;
}

export interface Finding extends Sourced {
  context_id: string | null; // null: the cited passages did not establish the company
  attribution_flag: string | null; // the anchor check disputes the filed company
  kind: Kind;
  statement: string;
  vendor: string | null;
  relationship: string | null;
  evidence_type: string;
  quantity: Quantity | null;
  qualifications: string[];
}

export interface CaseSummary {
  context_id: string;
  summary: string | null;
  finding_ids: string[];
  citations: string[];
}

export interface Answer {
  question_id: string;
  status: "generated" | "prepared" | "withheld";
  model: string;
  prompt_version: string;
  input_fingerprint: string;
  finding_ids: string[];
  citation_ids: string[];
  by_context: Record<string, string[]>;
  answer: string | null;
  per_case: CaseSummary[];
  gaps: string[];
  tensions: string[];
  citations: string[];
  error: string | null;
}

export interface Question {
  id: string;
  text: string;
  kinds: string[];
  documents: string[];
  vendors: string[];
  relationships: string[];
  answer: Answer | null;
}

export interface BatchOutcome {
  batch_id: string;
  status: "findings" | "no_findings" | "failed";
  input_fingerprint: string;
  finding_ids: string[];
  context_ids: string[];
  rejected: string[];
  error: string | null;
}

export interface Bundle {
  bundle_version: string;
  built: string;
  fingerprint: string;
  store_sha256: string;
  check: { status: string };
  versions: Record<string, string>;
  framing: {
    title: string;
    client_question: string;
    scope: string;
    market_share_unestimated: string;
    caveats: string[];
    review_summary: Record<ReviewState, number>;
    state_labels: Record<ReviewState, string>;
  };
  documents: Record<string, {
    label: string;
    source_filename: string;
    source_sha256: string;
    extraction_sha256: string;
    coverage: string;
    warnings: string[];
    profile_passage_ids: string[];
  }>;
  sections: Record<string, { document_id: string; heading: string; citation_id: string | null; batch_id: string | null }>;
  passages: Passage[];
  contexts: Context[];
  findings: Finding[];
  matrix: { rows: string[]; columns: Kind[]; cells: Record<string, string[]> };
  counts: {
    contexts_per_vendor_relationship: { vendor: string; relationship: string; context_ids: string[] }[];
    findings_per_kind_per_context: Record<string, Record<string, number>>;
    evidence_type_mix: Record<string, number>;
    review_progress: Record<ReviewState, number>;
  };
  runs: { id: string; model: string; prompt_version: string; contract_version: string; batches: BatchOutcome[] }[];
  questions: Question[];
}
