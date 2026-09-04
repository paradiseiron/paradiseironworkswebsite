import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSiteVisitWriteRole } from "@/lib/roles";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireSiteVisitWriteRole(user.id);
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

  const supabase = createAdminClient();
  const { data: existingProject, error: projectError } = await supabase
    .from("projects")
    .select("site_visit_image_paths")
    .eq("id", id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }
  if (!existingProject) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const existingImagePaths = new Set(
    Array.isArray(existingProject.site_visit_image_paths)
      ? existingProject.site_visit_image_paths.filter(
          (path: unknown): path is string => typeof path === "string"
        )
      : []
  );
  const imagePaths = (body.imagePaths || []).filter(
    (path) =>
      typeof path === "string" &&
      (path.startsWith(`${user.id}/${id}/`) || existingImagePaths.has(path)) &&
      !path.includes("..")
  );
  const updatedAt = new Date().toISOString();
  const { data: project, error } = await supabase
    .from("projects")
    .update({
      site_visit_scope_observations: body.scopeObservations.trim(),
      site_visit_notes: body.visitNotes.trim(),
      site_visit_exclusion_notes: body.exclusionNotes?.trim() || null,
      site_visit_access_safety_concerns:
        body.accessSafetyConcerns?.trim() || null,
      site_visit_image_paths: imagePaths,
      updated_at: updatedAt,
    })
    .eq("id", id)
    .select("customer_name")
    .single();

  if (error || !project) {
    console.error("Unable to save site visit details:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to save site visit details." },
      { status: 500 }
    );
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "site_visit_updated",
    activity_date: updatedAt,
    summary: "Site visit details updated.",
  });

  return NextResponse.json({ success: true });
}
