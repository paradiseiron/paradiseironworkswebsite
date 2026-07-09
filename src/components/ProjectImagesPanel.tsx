"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type ProjectImage = {
  id: string;
  storagePath: string;
  url: string;
  fileName?: string | null;
  createdAt?: string | null;
};

export default function ProjectImagesPanel({
  projectId,
  images,
  readOnly = false,
}: {
  projectId: string;
  images: ProjectImage[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadPhotos(formData: FormData) {
    setBusy(true);
    setMessage("Uploading photos...");

    try {
      const files = [
        ...formData.getAll("camera_photos"),
        ...formData.getAll("photos"),
      ].filter((value): value is File => value instanceof File && value.size > 0);

      if (!files.length) {
        setMessage("Choose at least one photo to upload.");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired.");

      const uploadedImages = [];

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `${projectId}/${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage
          .from("project-images")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        uploadedImages.push({
          storagePath,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        });
      }

      setMessage("Saving photo details...");
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: uploadedImages }),
        }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Unable to save project photos.");
      }

      setMessage("Photos uploaded.");
      router.refresh();
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload project photos."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Project Photos</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Upload and review project reference photos.
          </p>
        </div>

        {!readOnly && (
          <form action={uploadPhotos} className="flex flex-wrap gap-3">
            <PhotoInput
              name="camera_photos"
              label="Take photos"
              icon={<Camera className="h-4 w-4" aria-hidden="true" />}
              capture="environment"
            />
            <PhotoInput
              name="photos"
              label="Choose photos"
              icon={<ImagePlus className="h-4 w-4" aria-hidden="true" />}
              multiple
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {busy ? "Uploading..." : "Upload"}
            </button>
          </form>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-amber-200">{message}</p>}

      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-white/10 bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.fileName || "Project photo"}
                className="aspect-square w-full object-cover transition group-hover:scale-105"
              />
              <span className="block truncate px-3 py-2 text-xs text-neutral-400">
                {image.fileName || "Project photo"}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-neutral-400">
          No project photos uploaded yet.
        </p>
      )}
    </section>
  );
}

function PhotoInput({
  name,
  label,
  icon,
  capture,
  multiple,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  capture?: "user" | "environment";
  multiple?: boolean;
}) {
  return (
    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
      {icon}
      {label}
      <input
        className="sr-only"
        type="file"
        name={name}
        accept="image/*"
        capture={capture}
        multiple={multiple}
      />
    </label>
  );
}
