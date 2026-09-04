import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const PAYMENT_METHODS = ["check", "ach", "wire", "credit_card", "cash", "other"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { amount?: unknown; method?: unknown } | null;
  const amount = Number(body?.amount);
  const method = typeof body?.method === "string" ? body.method : "";

  if (!Number.isFinite(amount) || amount <= 0 || !PAYMENT_METHODS.includes(method)) {
    return NextResponse.json({ error: "Enter a valid payment amount and method." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("status, proposal_amount, proposal_initial_payment_required, initial_payment_received_at")
    .eq("id", id)
    .maybeSingle();
  if (projectError || !project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (!["active", "completed"].includes(project.status || "")) {
    return NextResponse.json({ error: "Payments can be recorded once the project is active." }, { status: 409 });
  }
  if (!project.proposal_initial_payment_required) {
    return NextResponse.json({ error: "This proposal is not configured for an initial-payment invoice." }, { status: 409 });
  }
  if (project.initial_payment_received_at) {
    return NextResponse.json({ error: "The first payment has already been recorded." }, { status: 409 });
  }
  if (amount > Number(project.proposal_amount || 0)) {
    return NextResponse.json({ error: "The payment cannot exceed the contract amount." }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const { error } = await supabase.from("projects").update({
    initial_payment_received_amount: amount,
    initial_payment_method: method,
    initial_payment_received_at: receivedAt,
    initial_payment_recorded_by: user.id,
    updated_at: receivedAt,
  }).eq("id", id).is("initial_payment_received_at", null);
  if (error) return NextResponse.json({ error: "Unable to record the payment." }, { status: 500 });

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "payment_received",
    activity_date: receivedAt,
    summary: `Initial payment of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received by ${method.replaceAll("_", " ")}.`,
  });
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath(`/admin/projects/${id}/invoice`);
  return NextResponse.json({ ok: true, amount, method, receivedAt });
}
