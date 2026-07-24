import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id, imageId } = await context.params;
  const supabase = createAdminClient();

  const { data: image, error: imageError } = await supabase
    .from("project_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("project_id", id)
    .maybeSingle();

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }
  if (!image) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const { error: storageError } = await supabase.storage
    .from("project-images")
    .remove([image.storage_path]);
  if (storageError) {
    return NextResponse.json(
      { error: "Unable to remove the stored photo." },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabase
    .from("project_images")
    .delete()
    .eq("id", image.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "note",
    summary: "1 project photo removed.",
  });
  revalidatePath(`/admin/projects/${id}`);
  return NextResponse.json({ ok: true });
}
