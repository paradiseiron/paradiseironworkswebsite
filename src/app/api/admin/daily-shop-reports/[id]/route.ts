import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  if ((await getUserRole(user.id)) !== "operations_foreman") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const supabase = createAdminClient();

  const { data: report } = await supabase
    .from("daily_shop_reports")
    .select("created_by, daily_shop_report_images(storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paths =
    report.daily_shop_report_images
      ?.map((image) => image.storage_path)
      .filter(Boolean) || [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage
      .from("daily-shop-report-images")
      .remove(paths);
    if (storageError) {
      return NextResponse.json(
        { error: "Unable to remove the report's stored photos." },
        { status: 500 }
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("daily_shop_reports")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/admin/daily-shop-report");
  return NextResponse.json({ ok: true });
}
