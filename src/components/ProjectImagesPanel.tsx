"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText, ImagePlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SelectedImagePreview from "@/components/SelectedImagePreview";
import { prepareImageInput } from "@/lib/image-compression";

export type ProjectImage = {
  id: string;
  storagePath: string;
  url: string;
  thumbnailUrl?: string;
  fileName?: string | null;
  contentType?: string | null;
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
  const [removingImageId, setRemovingImageId] = useState("");
  const [cameraPhotos, setCameraPhotos] = useState<File[]>([]);
  const [chosenPhotos, setChosenPhotos] = useState<File[]>([]);
  const selectedPhotos = [...cameraPhotos, ...chosenPhotos];

  async function uploadPhotos(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage("Uploading photos...");

    try {
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
            cacheControl: "31536000",
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
      setCameraPhotos([]);
      setChosenPhotos([]);
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

  async function handleCameraPhotos(files: File[]) {
    setCameraPhotos(files);
    setChosenPhotos([]);
    await uploadPhotos(files);
  }

  async function handleChosenPhotos(files: File[]) {
    setChosenPhotos(files);
    setCameraPhotos([]);
    await uploadPhotos(files);
  }

  async function removePhoto(imageId: string) {
    if (!window.confirm("Remove this project photo permanently?")) return;
    setRemovingImageId(imageId);
    setMessage("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/images/${encodeURIComponent(imageId)}`,
        { method: "DELETE" }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error || "Unable to remove project photo.");
      }
      setMessage("Photo removed.");
      router.refresh();
    } catch (removeError) {
      setMessage(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove project photo."
      );
    } finally {
      setRemovingImageId("");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Project Files</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Upload and review project photos, drawings, and plans.
          </p>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-3">
            <PhotoInput
              label="Take photos"
              icon={<Camera className="h-4 w-4" aria-hidden="true" />}
              capture="environment"
              disabled={busy}
              onFilesSelected={handleCameraPhotos}
            />
            <PhotoInput
              label="Choose photos"
              icon={<ImagePlus className="h-4 w-4" aria-hidden="true" />}
              multiple
              disabled={busy}
              onFilesSelected={handleChosenPhotos}
            />
          </div>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-amber-200">{message}</p>}
      {images.some((image) => image.contentType === "application/pdf") && (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Customer-supplied documents are untrusted. Confirm the sender and use
          normal endpoint protection before opening.
        </p>
      )}

      <div className="mt-4">
        <SelectedImagePreview
          files={selectedPhotos}
          actionLabel={busy ? "Uploading automatically…" : "Uploaded"}
        />
      </div>

      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900"
            >
              <a href={image.url} target="_blank" rel="noreferrer" className="block">
                {image.contentType === "application/pdf" ||
                image.contentType === "image/heic" ||
                image.contentType === "image/heif" ? (
                  <span className="flex aspect-square w-full items-center justify-center bg-white/[0.03] text-neutral-400">
                    <FileText className="h-12 w-12" aria-hidden="true" />
                  </span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.fileName || "Project file"}
                    className="aspect-square w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <span className="block truncate px-3 py-2 text-xs text-neutral-400">
                  {image.fileName || "Project photo"}
                </span>
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removePhoto(image.id)}
                  disabled={Boolean(removingImageId)}
                  aria-label={`Remove ${image.fileName || "project photo"}`}
                  title="Remove photo"
                  className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/30 bg-neutral-950/90 text-red-300 shadow-lg disabled:cursor-wait disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-neutral-400">
          No project files uploaded yet.
        </p>
      )}
    </section>
  );
}

function PhotoInput({
  label,
  icon,
  capture,
  multiple,
  disabled,
  onFilesSelected,
}: {
  label: string;
  icon: React.ReactNode;
  capture?: "user" | "environment";
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => Promise<void>;
}) {
  return (
    <label
      className={`inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition ${
        disabled
          ? "cursor-wait opacity-60"
          : "cursor-pointer hover:border-white/20 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      {label}
      <input
        className="sr-only"
        type="file"
        accept="image/*"
        capture={capture}
        multiple={multiple}
        disabled={disabled}
        onChange={async (event) =>
          await onFilesSelected(await prepareImageInput(event.currentTarget))
        }
      />
    </label>
  );
}
