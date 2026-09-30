import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

async function canWrite(userId: string) {
  const role = await getUserRole(userId);
  return role !== "viewer" && role !== "unassigned";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, itemId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const task = typeof body.task === "string" ? body.task.trim() : "";
  if (!task) return NextResponse.json({ error: "Enter a checklist task." }, { status: 400 });
  const statuses = ["not_started", "in_progress", "complete", "not_applicable"] as const;
  const status = statuses.includes(body.status) ? body.status : "not_started";
  const supabase = createAdminClient();
  const { data: bid } = await supabase.from("bid_opportunities").select("status").eq("id", id).maybeSingle();
  if (bid?.status !== "won") return NextResponse.json({ error: "A post-bid checklist is available only for won bids." }, { status: 400 });
  const { error, count } = await supabase.from("bid_post_win_checklist_items").update({
    task,
    owner_name: typeof body.ownerName === "string" ? body.ownerName.trim() || null : null,
    due_date: typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null,
    status,
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    updated_at: new Date().toISOString(),
  }, { count: "exact" }).eq("id", itemId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireAuthenticatedUser();
  if (!(await canWrite(user.id))) return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, itemId } = await context.params;
  const { error, count } = await createAdminClient().from("bid_post_win_checklist_items").delete({ count: "exact" }).eq("id", itemId).eq("bid_opportunity_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
