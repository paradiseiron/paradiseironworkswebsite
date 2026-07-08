import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalRole } from "@/lib/roles";

type ProjectImagePayload = {
  storagePath?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  sizeBytes?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { images?: ProjectImagePayload[] }
    | null;

  const images = Array.isArray(body?.images)
    ? body.images
        .map((image) => ({
          project_id: id,
          storage_path:
            typeof image.storagePath === "string" ? image.storagePath : "",
          file_name: typeof image.fileName === "string" ? image.fileName : null,
          content_type:
            typeof image.contentType === "string" ? image.contentType : null,
          size_bytes:
            typeof image.sizeBytes === "number" &&
            Number.isFinite(image.sizeBytes)
              ? image.sizeBytes
              : null,
          uploaded_by: user.id,
        }))
        .filter((image) => image.storage_path)
    : [];

  if (!images.length) {
    return NextResponse.json(
      { error: "At least one uploaded image is required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_images")
    .insert(images)
    .select("*");

  if (error) {
    console.error("Project image insert failed:", error);
    return NextResponse.json(
      { error: "Unable to save project photos." },
      { status: 500 }
    );
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "note",
    summary:
      images.length === 1
        ? "1 project photo uploaded."
        : `${images.length} project photos uploaded.`,
  });

  return NextResponse.json({ images: data || [] });
}
