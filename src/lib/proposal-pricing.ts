export type ProposalPricingLineItem = {
  description: string;
  amount: number | null;
  price: number | null;
};

export function normalizeProposalPricingItems(
  value: unknown,
  fallbackAmount?: unknown,
  fallbackPricing?: unknown
): ProposalPricingLineItem[] {
  const items = Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") return null;

          const record = item as Record<string, unknown>;
          const description = String(record.description || "").trim();
          const amount = optionalNumber(record.amount);
          const price = optionalNumber(record.price);

          if (!description && amount === null && price === null) return null;

          return { description, amount, price };
        })
        .filter((item): item is ProposalPricingLineItem => Boolean(item))
    : [];

  if (items.length > 0) return items;

  const amount = optionalNumber(fallbackAmount);
  const pricing = String(fallbackPricing || "").trim();

  if (amount !== null && amount > 0) {
    return [
      {
        description: pricing || "Total Contract Amount",
        amount: 1,
        price: amount,
      },
    ];
  }

  if (pricing) {
    return [{ description: pricing, amount: 1, price: null }];
  }

  return [{ description: "", amount: 1, price: null }];
}

export function proposalPricingTotal(items: ProposalPricingLineItem[]) {
  return items.reduce(
    (total, item) => total + lineItemTotal(item.amount, item.price),
    0
  );
}

export function lineItemTotal(amount: number | null, price: number | null) {
  if (amount === null || price === null) return 0;
  return amount * price;
}

export function parseProposalPricingItemsFromForm(formData: FormData) {
  const descriptions = formData.getAll("proposal_pricing_description");
  const amounts = formData.getAll("proposal_pricing_amount");
  const prices = formData.getAll("proposal_pricing_price");
  const rowCount = Math.max(descriptions.length, amounts.length, prices.length);
  const items: ProposalPricingLineItem[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const description = String(descriptions[index] || "").trim();
    const amount = optionalNumber(amounts[index]);
    const price = optionalNumber(prices[index]);

    if (!description && amount === null && price === null) continue;

    items.push({ description, amount, price });
  }

  return items;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
