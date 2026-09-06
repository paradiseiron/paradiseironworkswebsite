import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

async function canWrite(userId: string) {
  const role = await getUserRole(userId);
  return role !== "viewer" && role !== "unassigned";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; workItemId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, workItemId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) return NextResponse.json({ error: "Enter a work item description." }, { status: 400 });
  const valueText = typeof body.scheduledValue === "string" ? body.scheduledValue.trim() : "";
  if (valueText && !/^-?\d+(\.\d{1,2})?$/.test(valueText)) return NextResponse.json({ error: "Enter a valid USD amount." }, { status: 400 });
  const scheduledValue = valueText ? Number(valueText) : null;
  const itemType = body.itemType === "change_order" ? "change_order" : "original_contract";
  if (scheduledValue !== null && (!Number.isFinite(scheduledValue) || (itemType === "original_contract" && scheduledValue < 0))) return NextResponse.json({ error: "Enter a valid scheduled value." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: bid } = await supabase.from("bid_opportunities").select("status").eq("id", id).maybeSingle();
  if (bid?.status !== "won") return NextResponse.json({ error: "A schedule of work is only available for won bids." }, { status: 400 });
  const { data: current } = await supabase.from("bid_work_items").select("*").eq("id", workItemId).eq("bid_opportunity_id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Work item not found." }, { status: 404 });
  const now = new Date().toISOString();
  const statuses = ["not_started", "fabrication", "delivery", "installation", "ready_for_billing", "paid"] as const;
  const workStatus = statuses.includes(body.workStatus) ? body.workStatus : "not_started";
  const approvalStatuses = ["proposed", "pending_approval", "approved", "rejected"] as const;
  const approvalStatus = itemType === "change_order" && approvalStatuses.includes(body.changeOrderApprovalStatus) ? body.changeOrderApprovalStatus : null;
  if (itemType === "change_order" && !String(body.changeOrderNumber || "").trim()) return NextResponse.json({ error: "Enter a change order number." }, { status: 400 });
  if (itemType === "change_order" && approvalStatus !== "approved" && ["ready_for_billing", "paid"].includes(workStatus)) return NextResponse.json({ error: "Only approved change orders can be ready for billing or paid." }, { status: 400 });
  const selectedIndex = statuses.indexOf(workStatus);
  const reached = (status: typeof statuses[number]) => selectedIndex >= statuses.indexOf(status);
  const timestamp = (status: typeof statuses[number], columnName: string) => reached(status) ? current[columnName] || now : null;
  const { error } = await supabase.from("bid_work_items").update({
    description, scheduled_value: scheduledValue,
    item_type: itemType,
    change_order_number: itemType === "change_order" ? String(body.changeOrderNumber).trim() : null,
    change_order_approval_status: approvalStatus,
    change_order_approved_at: approvalStatus === "approved" && /^\d{4}-\d{2}-\d{2}$/.test(body.changeOrderApprovedAt) ? body.changeOrderApprovedAt : null,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    work_status: workStatus,
    fabrication_complete: reached("fabrication"), fabrication_completed_at: timestamp("fabrication", "fabrication_completed_at"),
    delivery_complete: reached("delivery"), delivery_completed_at: timestamp("delivery", "delivery_completed_at"),
    installation_complete: reached("installation"), installation_completed_at: timestamp("installation", "installation_completed_at"),
    ready_for_billing: reached("ready_for_billing"), ready_for_billing_at: timestamp("ready_for_billing", "ready_for_billing_at"),
    paid: reached("paid"), paid_at: timestamp("paid", "paid_at"), updated_at: now,
  }).eq("id", workItemId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; workItemId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, workItemId } = await context.params;
  const { error, count } = await createAdminClient().from("bid_work_items").delete({ count: "exact" }).eq("id", workItemId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Work item not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
