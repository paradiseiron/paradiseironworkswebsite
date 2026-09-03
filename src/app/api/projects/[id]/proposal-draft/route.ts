import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalRole } from "@/lib/roles";
import {
  normalizeProposalPricingItems,
  proposalPricingTotal,
} from "@/lib/proposal-pricing";

type ProposalDraftBody = Record<string, unknown>;

const TEXT_FIELDS = [
  "proposal_project_name",
  "proposal_attention",
  "proposal_office_phone",
  "proposal_cell_phone",
  "proposal_email",
  "proposal_intro",
  "proposal_scope",
  "proposal_finish",
  "proposal_exclusions",
  "proposal_payment_terms",
  "proposal_schedule",
  "proposal_clarifications",
  "proposal_customer_responsibilities",
  "proposal_terms_and_conditions",
  "proposal_prepared_by",
  "proposal_prepared_by_title",
  "proposal_mhic_salesperson_name",
  "proposal_mhic_salesperson_license_number",
  "proposal_mhic_payment_schedule",
  "proposal_mhic_finance_charge",
  "proposal_mhic_collateral_security",
  "proposal_mhic_incorporated_documents",
  "proposal_mhic_door_to_door_status",
  "proposal_mhic_warranty_claim_procedure",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const body = (await request.json()) as ProposalDraftBody;

  const update: Record<string, string | number | boolean | unknown[] | null> = {};

  for (const field of TEXT_FIELDS) {
    if (typeof body[field] === "string") {
      update[field] = body[field] as string;
    }
  }

  const proposalPricingItems = normalizeProposalPricingItems(
    body.proposal_pricing_items
  ).filter(
    (item) => item.description || item.amount !== null || item.price !== null
  );

  update.proposal_pricing = "";
  update.proposal_pricing_items = proposalPricingItems;
  update.proposal_amount = proposalPricingItems.length
    ? proposalPricingTotal(proposalPricingItems)
    : null;
  update.proposal_deposit_amount = optionalAmount(
    body.proposal_deposit_amount
  );
  update.proposal_mhic_enabled = body.proposal_mhic_enabled === "true";
  update.proposal_mhic_buyer_age_65_plus =
    body.proposal_mhic_buyer_age_65_plus === "true";
  update.proposal_mhic_secured_by_property =
    body.proposal_mhic_secured_by_property === "true";
  for (const field of [
    "proposal_mhic_contract_date",
    "proposal_mhic_start_date",
    "proposal_mhic_completion_date",
    "proposal_mhic_cancellation_deadline",
  ] as const) {
    update[field] =
      typeof body[field] === "string" && body[field].trim()
        ? body[field]
        : null;
  }
  update.proposal_updated_at = new Date().toISOString();
  update.updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").update(update).eq("id", id);

  if (error) {
    console.error("Proposal autosave failed:", error);
    return NextResponse.json(
      { error: "Unable to autosave proposal." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}

function optionalAmount(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
