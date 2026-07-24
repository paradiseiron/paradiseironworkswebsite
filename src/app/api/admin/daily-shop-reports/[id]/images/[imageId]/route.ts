import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  if (role !== "operations_foreman") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, imageId } = await context.params;
  const supabase = createAdminClient();
  const { data: report } = await supabase
    .from("daily_shop_reports")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: image, error: imageError } = await supabase
    .from("daily_shop_report_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("report_id", id)
    .maybeSingle();
  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }
  if (!image) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const { error: storageError } = await supabase.storage
    .from("daily-shop-report-images")
    .remove([image.storage_path]);
  if (storageError) {
    return NextResponse.json(
      { error: "Unable to remove the stored photo." },
      { status: 500 }
    );
  }
  const { error: deleteError } = await supabase
    .from("daily_shop_report_images")
    .delete()
    .eq("id", image.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath(`/admin/daily-shop-report/${id}`);
  return NextResponse.json({ ok: true });
}
