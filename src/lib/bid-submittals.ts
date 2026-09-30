export const BID_SUBMITTAL_TYPES = [
  "Shop Drawings",
  "Delegated Design / Engineering Calculations",
  "Product Data",
  "Material Sample",
  "Finish / Color Sample",
  "Mockup",
  "Fabricator Certification",
  "Welder Certification",
  "Welding Procedure (WPS/PQR)",
  "Material Test Report / Mill Certification",
  "Coating / Galvanizing Certification",
  "Anchor / Fastener Data",
  "Safety Data Sheet",
  "Installation Procedure",
  "Operation & Maintenance Data",
  "Warranty",
  "Closeout Documents",
  "Other",
] as const;

export const BID_SUBMITTAL_STATUSES = [
  "draft",
  "preparing",
  "submitted",
  "approved",
  "approved_as_noted",
  "revise_and_resubmit",
  "rejected",
  "closed",
] as const;

export type BidSubmittalStatus = (typeof BID_SUBMITTAL_STATUSES)[number];

export function bidSubmittalStatusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
