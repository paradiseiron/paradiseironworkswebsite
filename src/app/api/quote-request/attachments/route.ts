import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAllowedQuoteAttachment,
  QUOTE_ATTACHMENT_MAX_FILES,
  QUOTE_ATTACHMENT_MAX_FILE_BYTES,
  QUOTE_ATTACHMENT_MAX_TOTAL_BYTES,
} from "@/lib/quote-attachments";

type Attachment = {
  path?: unknown;
  name?: unknown;
  type?: unknown;
  size?: unknown;
};

function hasExpectedSignature(bytes: Uint8Array, type: string) {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);
  const ascii = new TextDecoder("latin1").decode(bytes);

  if (type === "application/pdf") return ascii.slice(0, 1024).includes("%PDF-");
  if (type === "image/jpeg") return startsWith(0xff, 0xd8, 0xff);
  if (type === "image/png")
    return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (type === "image/webp")
    return (
      startsWith(0x52, 0x49, 0x46, 0x46) &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  if (type === "image/heic" || type === "image/heif") {
    return ascii.slice(4, 12).startsWith("ftyp") &&
      /hei[cf]|mif1|msf1/.test(ascii.slice(8, 64));
  }
  return false;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const body = (await request.json().catch(() => null)) as
    | { projectId?: unknown; attachments?: Attachment[] }
    | null;
  const projectId =
    typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const attachments = Array.isArray(body?.attachments)
    ? body.attachments.map((file) => ({
        path: typeof file.path === "string" ? file.path : "",
        name: typeof file.name === "string" ? file.name : "",
        type: typeof file.type === "string" ? file.type.toLowerCase() : "",
        size:
          typeof file.size === "number" && Number.isFinite(file.size)
            ? file.size
            : -1,
      }))
    : [];

  if (!token || !projectId || !attachments.length) {
    return NextResponse.json({ error: "Invalid attachment request." }, { status: 400 });
  }

  if (
    attachments.length > QUOTE_ATTACHMENT_MAX_FILES ||
    attachments.some(
      (file) =>
        !file.path.startsWith(`${projectId}/website/`) ||
        !isAllowedQuoteAttachment(file) ||
        file.size <= 0 ||
        file.size > QUOTE_ATTACHMENT_MAX_FILE_BYTES
    ) ||
    attachments.reduce((total, file) => total + file.size, 0) >
      QUOTE_ATTACHMENT_MAX_TOTAL_BYTES
  ) {
    return NextResponse.json({ error: "Invalid attachments." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: session } = await supabase
    .from("quote_attachment_sessions")
    .select("project_id, token_hash, expires_at, finalized_at")
    .eq("project_id", projectId)
    .maybeSingle();

  if (
    !session ||
    session.token_hash !== tokenHash ||
    session.finalized_at ||
    new Date(session.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Attachment authorization has expired." },
      { status: 403 }
    );
  }

  const paths = attachments.map((file) => file.path);
  for (const attachment of attachments) {
    const { data: blob, error } = await supabase.storage
      .from("quote-attachments")
      .download(attachment.path);
    if (
      error ||
      !blob ||
      blob.size !== attachment.size ||
      blob.size > QUOTE_ATTACHMENT_MAX_FILE_BYTES
    ) {
      await supabase.storage.from("quote-attachments").remove(paths);
      return NextResponse.json(
        { error: "An uploaded file could not be verified." },
        { status: 400 }
      );
    }
    const bytes = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
    if (!hasExpectedSignature(bytes, attachment.type)) {
      console.error("Quote attachment signature mismatch:", {
        projectId,
        contentType: attachment.type,
        fileName: attachment.name,
      });
      await supabase.storage.from("quote-attachments").remove(paths);
      return NextResponse.json(
        { error: "An uploaded file did not match its declared file type." },
        { status: 400 }
      );
    }
  }

  const { error: insertError } = await supabase.from("project_images").insert(
    attachments.map((file) => ({
      project_id: projectId,
      storage_path: file.path,
      storage_bucket: "quote-attachments",
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: null,
    }))
  );
  if (insertError) {
    await supabase.storage.from("quote-attachments").remove(paths);
    return NextResponse.json(
      { error: "Unable to save the uploaded file details." },
      { status: 500 }
    );
  }

  await Promise.all([
    supabase
      .from("quote_attachment_sessions")
      .update({ finalized_at: new Date().toISOString() })
      .eq("project_id", projectId),
    supabase.from("project_activities").insert({
      project_id: projectId,
      activity_type: "note",
      summary:
        attachments.length === 1
          ? "1 website quote attachment uploaded."
          : `${attachments.length} website quote attachments uploaded.`,
    }),
  ]);

  return NextResponse.json({ success: true });
}
