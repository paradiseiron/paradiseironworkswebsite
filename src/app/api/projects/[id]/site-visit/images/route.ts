import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireSiteVisitWriteRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireSiteVisitWriteRole(user.id);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { path?: unknown }
    | null;
  const path = typeof body?.path === "string" ? body.path : "";
  if (!path) {
    return NextResponse.json({ error: "Photo path is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("site_visit_image_paths")
    .eq("id", id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const paths = Array.isArray(project.site_visit_image_paths)
    ? project.site_visit_image_paths.filter(
        (value: unknown): value is string => typeof value === "string"
      )
    : [];
  if (!paths.includes(path)) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const { error: storageError } = await supabase.storage
    .from("site-visit-images")
    .remove([path]);
  if (storageError) {
    return NextResponse.json(
      { error: "Unable to remove the stored photo." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      site_visit_image_paths: paths.filter((value) => value !== path),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath(`/admin/projects/${id}`);
  return NextResponse.json({ ok: true });
}
