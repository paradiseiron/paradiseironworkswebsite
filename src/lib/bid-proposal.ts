export type BidScopeSection = { title: string; content: string };
export type BidPricingItem = {
  description: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  amount: number | null;
};

export function normalizeBidScopeSections(value: unknown): BidScopeSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = String(row.title || "").trim();
    const content = String(row.content || "").trim();
    return title || content ? [{ title, content }] : [];
  });
}

export function normalizeBidPricingItems(value: unknown): BidPricingItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const description = String(row.description || "").trim();
    const quantityValue = row.quantity === "" || row.quantity == null ? null : Number(row.quantity);
    const unitPriceValue = row.unitPrice === "" || row.unitPrice == null ? null : Number(row.unitPrice);
    const parsed = row.amount === "" || row.amount == null ? null : Number(row.amount);
    const quantity = Number.isFinite(quantityValue) ? quantityValue : null;
    const unitPrice = Number.isFinite(unitPriceValue) ? unitPriceValue : null;
    const amount = Number.isFinite(parsed) ? parsed : null;
    return description || amount !== null
      ? [{ description, quantity, unit: String(row.unit || "").trim(), unitPrice, amount }]
      : [];
  });
}

export function bidProposalTotal(project: Record<string, unknown>) {
  if (project.proposal_pricing_mode === "line_items") {
    return normalizeBidPricingItems(project.proposal_pricing_items).reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
  }
  return Number(project.proposal_lump_sum_amount || 0);
}

export function formatBidCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
