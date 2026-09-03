import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewRequestEmail } from "@/lib/email/review-request";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("customer_name, contact_name, email, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (project.status !== "completed") return NextResponse.json({ error: "Review requests are available only after the project is completed." }, { status: 409 });
  if (!project.email?.trim()) return NextResponse.json({ error: "Add a customer email before sending a review request." }, { status: 400 });

  const result = await sendReviewRequestEmail({
    recipient: project.email.trim(),
    customerName: project.contact_name || project.customer_name || "there",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });

  const sentAt = new Date().toISOString();
  await Promise.all([
    supabase.from("projects").update({ review_request_sent_at: sentAt, updated_at: sentAt }).eq("id", id),
    supabase.from("project_activities").insert({ project_id: id, activity_type: "review_request_sent", activity_date: sentAt, summary: `Google review request emailed to ${project.email.trim()}.` }),
  ]);
  return NextResponse.json({ ok: true, sentAt });
}
