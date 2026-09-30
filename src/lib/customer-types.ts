/** Stable customer relationship categories for filtering and future marketing segments. */
export const CUSTOMER_TYPES = [
  { value: "Homeowner", label: "Homeowner" },
  { value: "Commercial owner / operator", label: "Commercial owner / operator" },
  { value: "Property manager", label: "Property manager" },
  { value: "General contractor", label: "General contractor" },
  { value: "Architect / designer", label: "Architect / designer" },
  { value: "Developer", label: "Developer" },
  { value: "Other business / organization", label: "Other business / organization" },
  { value: "Other", label: "Other" },
  // Existing broad values remain available so previously classified profiles are not reclassified by guesswork.
  { value: "Residential", label: "Residential (unspecified)" },
  { value: "Commercial", label: "Commercial (unspecified)" },
] as const;

export function isCustomerType(value: string) {
  return !value || CUSTOMER_TYPES.some((type) => type.value === value);
}

export function customerTypeLabel(value?: string | null) {
  return CUSTOMER_TYPES.find((type) => type.value === value)?.label || value || "—";
}
