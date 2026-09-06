import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; rfiId: string; attachmentId: string }> }) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, rfiId, attachmentId } = await params;
  const supabase = createAdminClient();
  const { data: attachment } = await supabase.from("bid_rfi_attachments").select("storage_path, bid_rfis!inner(bid_opportunity_id)").eq("id", attachmentId).eq("bid_rfi_id", rfiId).eq("bid_rfis.bid_opportunity_id", id).maybeSingle();
  if (!attachment) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  const { error: storageError } = await supabase.storage.from("bid-opportunity-documents").remove([attachment.storage_path]);
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });
  const { error } = await supabase.from("bid_rfi_attachments").delete().eq("id", attachmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
