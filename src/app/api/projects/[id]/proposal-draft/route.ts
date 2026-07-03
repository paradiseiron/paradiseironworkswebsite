import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalRole } from "@/lib/roles";

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
  "proposal_pricing",
  "proposal_payment_terms",
  "proposal_schedule",
  "proposal_clarifications",
  "proposal_prepared_by",
  "proposal_prepared_by_title",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const body = (await request.json()) as ProposalDraftBody;

  const update: Record<string, string | number | null> = {};

  for (const field of TEXT_FIELDS) {
    if (typeof body[field] === "string") {
      update[field] = body[field] as string;
    }
  }

  update.proposal_amount = optionalAmount(body.proposal_amount);
  update.proposal_deposit_amount = optionalAmount(
    body.proposal_deposit_amount
  );
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
