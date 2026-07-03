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
  await requireRole(user.id, "estimator");
  const { id } = await context.params;
  const body = (await request.json()) as {
    scopeObservations?: string;
    visitNotes?: string;
    exclusionNotes?: string;
    accessSafetyConcerns?: string;
    imagePaths?: string[];
  };

  if (!body.scopeObservations?.trim() || !body.visitNotes?.trim()) {
    return NextResponse.json(
      { error: "Scope observations and visit notes are required." },
      { status: 400 }
    );
  }

  const imagePaths = (body.imagePaths || []).filter(
    (path) =>
      typeof path === "string" &&
      path.startsWith(`${user.id}/${id}/`) &&
      !path.includes("..")
  );
  const completedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .update({
      site_visit_status: "completed",
      site_visit_scope_observations: body.scopeObservations.trim(),
      site_visit_notes: body.visitNotes.trim(),
      site_visit_exclusion_notes: body.exclusionNotes?.trim() || null,
      site_visit_access_safety_concerns:
        body.accessSafetyConcerns?.trim() || null,
      site_visit_image_paths: imagePaths,
      site_visit_completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", id)
    .eq("site_visit_assigned_to", user.id)
    .select("customer_name")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: "Unable to complete this assigned site visit." },
      { status: 500 }
    );
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "site_visit_completed",
    activity_date: completedAt,
    summary: "Estimator completed the site visit. Proposal drafting can begin.",
  });

  await sendWorkflowNotification({
    recipientRole: "admin",
    title: "Site visit completed",
    body: `${project.customer_name}'s site visit is complete and ready for proposal drafting.`,
    emailSubject: `Site visit completed: ${project.customer_name}`,
    url: `/admin/projects/${id}?tab=site-visit`,
    tag: `site-visit-completed-${id}`,
  });

  return NextResponse.json({ success: true });
}
