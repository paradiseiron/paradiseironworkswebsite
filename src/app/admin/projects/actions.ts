"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";

export async function resolveFollowUp(formData: FormData) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const supabase = await createClient();

  const project_id = String(formData.get("project_id") || "");
  const requestedReturnPath = String(
    formData.get("return_path") || "/admin/projects"
  );
  const return_path = requestedReturnPath.startsWith("/admin/")
    ? requestedReturnPath
    : "/admin/projects";
  const resolution_note = String(formData.get("resolution_note") || "");

  if (!project_id) {
    throw new Error("Project ID is required.");
  }

  const { data: updatedProject, error: projectError } = await supabase
    .from("projects")
    .update({
      has_open_follow_up: false,
      latest_follow_up_note: null,
      latest_follow_up_due_at: null,
      next_follow_up_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project_id)
    .select("id, has_open_follow_up")
    .single();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (updatedProject?.has_open_follow_up !== false) {
    throw new Error("Follow-up alert was not cleared.");
  }

  const { error: activityError } = await supabase
    .from("project_activities")
    .insert({
      project_id,
      activity_type: "follow_up",
      summary: resolution_note
        ? `Follow-up resolved. ${resolution_note}`
        : "Follow-up resolved.",
      requires_follow_up: false,
      follow_up_resolved_at: new Date().toISOString(),
    });

  if (activityError) {
    throw new Error(activityError.message);
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${project_id}`);

  redirect(return_path);
}
