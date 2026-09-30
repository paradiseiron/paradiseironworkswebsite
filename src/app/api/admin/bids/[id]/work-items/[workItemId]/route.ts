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
  const { data: current } = await supabase.from("bid_work_items").select("id").eq("id", workItemId).eq("bid_opportunity_id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Work item not found." }, { status: 404 });
  const now = new Date().toISOString();
  const approvalStatuses = ["proposed", "pending_approval", "approved", "rejected"] as const;
  const approvalStatus = itemType === "change_order" && approvalStatuses.includes(body.changeOrderApprovalStatus) ? body.changeOrderApprovalStatus : null;
  if (itemType === "change_order" && !String(body.changeOrderNumber || "").trim()) return NextResponse.json({ error: "Enter a change order number." }, { status: 400 });
  const amount = (value: unknown) => { const number = Number(value || 0); return Number.isFinite(number) ? number : 0; };
  const previousBilling = amount(body.previousBilling), currentBilling = amount(body.currentBilling), storedMaterials = amount(body.storedMaterials), retainageAmount = amount(body.retainageAmount);
  const totalBilled = previousBilling + currentBilling + storedMaterials;
  const completionStatus = Math.abs(totalBilled) < 0.005 || Math.abs(scheduledValue || 0) < 0.005 ? "not_completed" : Math.abs(totalBilled) >= Math.abs(scheduledValue || 0) - 0.01 ? "completed" : "partially_completed";
  if ([previousBilling, currentBilling, storedMaterials, retainageAmount].some((value) => value < 0) && scheduledValue !== null && scheduledValue >= 0) return NextResponse.json({ error: "Billing and retainage amounts cannot be negative for a positive-value line item." }, { status: 400 });
  if (scheduledValue !== null && scheduledValue >= 0 && totalBilled > scheduledValue + 0.01) return NextResponse.json({ error: "Total billed cannot exceed the scheduled value." }, { status: 400 });
  const { error } = await supabase.from("bid_work_items").update({
    description, scheduled_value: scheduledValue,
    item_type: itemType,
    change_order_number: itemType === "change_order" ? String(body.changeOrderNumber).trim() : null,
    change_order_approval_status: approvalStatus,
    change_order_approved_at: approvalStatus === "approved" && /^\d{4}-\d{2}-\d{2}$/.test(body.changeOrderApprovedAt) ? body.changeOrderApprovedAt : null,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    completion_status: completionStatus,
    previous_billing: previousBilling,
    current_billing: currentBilling,
    stored_materials: storedMaterials,
    retainage_amount: retainageAmount,
    billing_application_number: typeof body.billingApplicationNumber === "string" ? body.billingApplicationNumber.trim() || null : null,
    billing_period_to: typeof body.billingPeriodTo === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.billingPeriodTo) ? body.billingPeriodTo : null,
    billing_source_document: typeof body.billingSourceDocument === "string" ? body.billingSourceDocument.trim() || null : null,
    updated_at: now,
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
