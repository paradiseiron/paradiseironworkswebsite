import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/roles";
import { sendWorkflowNotification } from "@/lib/notifications/workflow-notification";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  const { id } = await context.params;
  const body = (await request.json()) as {
    scheduledDate?: string;
    windowStart?: string;
    windowEnd?: string;
    location?: string;
    adminNotes?: string;
  };

  if (
    !body.scheduledDate ||
    !body.windowStart ||
    !body.windowEnd ||
    !body.location?.trim()
  ) {
    return NextResponse.json(
      { error: "Date, time window, and location are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: estimators, error: estimatorError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "estimator")
    .limit(2);

  if (estimatorError || !estimators?.length) {
    return NextResponse.json(
      { error: "Create and assign an estimator user before scheduling." },
      { status: 400 }
    );
  }

  const estimatorId = estimators[0].user_id;
  const readyAt = new Date().toISOString();
  const { data: project, error } = await supabase
    .from("projects")
    .update({
      site_visit_status: "ready",
      site_visit_ready_at: readyAt,
      site_visit_scheduled_date: body.scheduledDate,
      site_visit_window_start: body.windowStart,
      site_visit_window_end: body.windowEnd,
      site_visit_location: body.location.trim(),
      site_visit_admin_notes: body.adminNotes?.trim() || null,
      site_visit_assigned_to: estimatorId,
      updated_at: readyAt,
    })
    .eq("id", id)
    .select("customer_name")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: "Unable to schedule site visit." },
      { status: 500 }
    );
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "site_visit_ready",
    activity_date: readyAt,
    summary: `Site visit scheduled for ${body.scheduledDate}, ${body.windowStart}–${body.windowEnd} at ${body.location.trim()}.`,
  });

  await sendWorkflowNotification({
    recipientRole: "estimator",
    title: "Site visit ready",
    body: `${project.customer_name}: ${body.scheduledDate}, ${body.windowStart}–${body.windowEnd} at ${body.location.trim()}.`,
    emailSubject: `Site visit ready: ${project.customer_name}`,
    url: `/admin/projects/${id}?tab=site-visit`,
    tag: `site-visit-ready-${id}`,
  });

  return NextResponse.json({ success: true });
}
