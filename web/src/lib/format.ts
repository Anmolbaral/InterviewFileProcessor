import type { Kind, Quantity, ReviewState } from "../types";

export const KIND_LABELS: Record<Kind, string> = {
  company_scale: "Company scale",
  vendor_relationship: "Vendor relationship",
  selection_criteria: "Selection criteria",
  pricing: "Pricing and cost",
  implementation: "Implementation",
  rating: "Ratings and likelihood",
};

export const EVIDENCE_LABELS: Record<string, string> = {
  firsthand_report: "Firsthand report",
  expert_estimate: "Expert estimate",
  attributed_explanation: "Attributed explanation",
  opinion: "Opinion",
  prompted_agreement: "Prompted agreement",
  hypothetical: "Hypothetical",
  analyst_inference: "Analyst inference",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  deployed: "Deployed",
  previously_used: "Previously used",
  evaluated: "Evaluated",
  hypothetical: "Hypothetical",
};

export const RELATIONSHIP_ORDER = ["deployed", "previously_used", "evaluated", "hypothetical"];

export const EMPLOYMENT_LABELS: Record<string, string> = {
  current: "current employer",
  historical: "historical employer",
  unclear: "employment unclear",
};

export const UNNAMED_VENDOR = "Custom or unnamed system";

export function vendorLabel(vendor: string | null): string {
  return vendor ?? UNNAMED_VENDOR;
}

export function relationshipLabel(relationship: string | null): string {
  return relationship ? RELATIONSHIP_LABELS[relationship] ?? relationship : "relationship not stated";
}

export function evidenceLabel(type: string): string {
  return EVIDENCE_LABELS[type] ?? type;
}

export function stateLabel(state: ReviewState, labels: Record<ReviewState, string>): string {
  return labels[state] ?? state;
}

/** The source's wording first, then only the parts the source stated. An open bound never becomes a midpoint. */
export function formatQuantity(quantity: Quantity | null, kind: Kind): string {
  if (!quantity) return kind === "pricing" ? "No figure stated" : "";
  const parts: string[] = [];
  if (quantity.approximate) parts.push("approx.");
  if (quantity.value !== null) parts.push(String(quantity.value));
  else if (quantity.low !== null && quantity.high !== null) parts.push(`${quantity.low}–${quantity.high}`);
  else if (quantity.low !== null) parts.push(`more than ${quantity.low}`);
  else if (quantity.high !== null) parts.push(`under ${quantity.high}`);
  if (quantity.currency) parts.push(quantity.currency);
  if (quantity.unit) parts.push(quantity.unit);
  if (quantity.period) parts.push(`per ${quantity.period}`);
  if (quantity.basis) parts.push(`(${quantity.basis})`);
  const hint = parts.join(" ");
  // A value inherited from the same answer is shown as such, never as if this figure stated it.
  const carried = quantity.carried?.length ? ` · ${quantity.carried.join(", ")} taken from the same answer` : "";
  return (hint ? `“${quantity.raw}” · ${hint}` : `“${quantity.raw}”`) + carried;
}
