import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { processCostDocument } from "@/lib/cost-extraction";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const maxDuration = 120;

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") return NextResponse.json({ error: "Write access is required." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("document");
  const projectRaw = String(form.get("project_id") || "").trim();
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a cost document." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Upload a PDF, JPG, PNG, or WebP file." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "The document must be 25 MB or smaller." }, { status: 400 });
  const projectId = projectRaw || null;
  const supabase = createAdminClient();
  if (projectId) {
    const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "cost-document";
  const id = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10);
  const path = `${date}/${id}/${safeName}`;
  const { error: uploadError } = await supabase.storage.from("cost-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Unable to upload the document." }, { status: 500 });
  const { data, error } = await supabase.from("cost_intake").insert({
    id, project_id: projectId, storage_path: path, file_name: file.name, content_type: file.type,
    size_bytes: file.size, status: "uploaded", uploaded_by: user.id,
  }).select("id").single();
  if (error) {
    await supabase.storage.from("cost-documents").remove([path]);
    return NextResponse.json({ error: "Unable to create the cost intake record." }, { status: 500 });
  }
  try {
    const extraction = await processCostDocument(data.id);
    return NextResponse.json({ id: data.id, extraction });
  } catch (processingError) {
    console.error("Cost document extraction failed:", processingError);
    return NextResponse.json({ id: data.id, extraction: { status: "failed" } });
  }
}
