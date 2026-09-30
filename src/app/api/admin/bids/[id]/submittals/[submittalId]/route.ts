import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { BID_SUBMITTAL_STATUSES, BID_SUBMITTAL_TYPES } from "@/lib/bid-submittals";

async function canWrite(userId: string) { const role = await getUserRole(userId); return role !== "viewer" && role !== "unassigned"; }
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
const text = (value: unknown) => typeof value === "string" ? value.trim() || null : null;

export async function PATCH(request: Request, context: { params: Promise<{ id: string; submittalId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, submittalId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Enter a submittal title." }, { status: 400 });
  const status = BID_SUBMITTAL_STATUSES.includes(body.status) ? body.status : "draft";
  const submittalType = BID_SUBMITTAL_TYPES.includes(body.submittalType) ? body.submittalType : "Other";
  const revisionNumber = Math.max(0, Number.isInteger(Number(body.revisionNumber)) ? Number(body.revisionNumber) : 0);
  const { error, count } = await createAdminClient().from("bid_submittals").update({ title, status, submittal_type: submittalType, revision_number: revisionNumber, specification_section: text(body.specificationSection), responsible_party: text(body.responsibleParty), submitted_to: text(body.submittedTo), required_date: date(body.requiredDate), submitted_date: date(body.submittedDate), response_due_date: date(body.responseDueDate), response_date: date(body.responseDate), description: text(body.description), reviewer_comments: text(body.reviewerComments), updated_at: new Date().toISOString() }, { count: "exact" }).eq("id", submittalId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Submittal not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; submittalId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, submittalId } = await context.params;
  const { error, count } = await createAdminClient().from("bid_submittals").delete({ count: "exact" }).eq("id", submittalId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Submittal not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
