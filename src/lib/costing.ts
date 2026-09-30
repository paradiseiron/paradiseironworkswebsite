export const costCategories = [
  ["materials", "Materials"],
  ["labor", "Labor"],
  ["subcontractor", "Subcontractor"],
  ["equipment", "Equipment"],
  ["rental", "Rental"],
  ["freight_delivery", "Freight / delivery"],
  ["permits_fees", "Permits / fees"],
  ["fuel", "Fuel"],
  ["other", "Other"],
] as const;

export type CostCategory = (typeof costCategories)[number][0];

export function costCategoryLabel(value: string | null) {
  return costCategories.find(([key]) => key === value)?.[1] || "Uncategorized";
}

export function formatCost(value: number | string | null) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}
