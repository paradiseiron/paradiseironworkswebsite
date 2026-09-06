import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; rfiId: string }> }) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id, rfiId } = await params;
  const formData = await request.formData();
  const file = formData.get("attachment");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Select a file." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "RFI attachments must be 25 MB or smaller." }, { status: 400 });
  const supabase = createAdminClient();
  const { data: rfi } = await supabase.from("bid_rfis").select("id, bid_opportunities!inner(status)").eq("id", rfiId).eq("bid_opportunity_id", id).eq("bid_opportunities.status", "won").maybeSingle();
  if (!rfi) return NextResponse.json({ error: "RFI not found." }, { status: 404 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${id}/rfis/${rfiId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("bid-opportunity-documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const { error } = await supabase.from("bid_rfi_attachments").insert({ bid_rfi_id: rfiId, storage_path: path, file_name: file.name, content_type: file.type || null, size_bytes: file.size, attachment_type: formData.get("attachmentType") === "response" ? "response" : "request", uploaded_by: user.id });
  if (error) { await supabase.storage.from("bid-opportunity-documents").remove([path]); return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
