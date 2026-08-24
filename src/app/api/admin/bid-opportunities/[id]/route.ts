import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  const { id } = await context.params;
  const supabase = createAdminClient();
  const { data: documents, error: documentError } = await supabase
    .from("bid_opportunity_documents")
    .select("storage_path")
    .eq("bid_opportunity_id", id);
  if (documentError) return NextResponse.json({ error: documentError.message }, { status: 500 });

  const paths = (documents || []).map((document) => document.storage_path).filter(Boolean);
  if (paths.length) {
    const { error } = await supabase.storage.from("bid-opportunity-documents").remove(paths);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error } = await supabase.from("bid_opportunities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
