"use client";

import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import SelectedImagePreview from "@/components/SelectedImagePreview";
import { prepareImageInput } from "@/lib/image-compression";

export default function NewProjectPhotoFields() {
  const [cameraPhotos, setCameraPhotos] = useState<File[]>([]);
  const [chosenPhotos, setChosenPhotos] = useState<File[]>([]);
  const selectedPhotos = [...cameraPhotos, ...chosenPhotos];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Project Photos</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Attach reference photos, drawings, or other relevant project images.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PhotoInput
          name="camera_photos"
          label="Take photos"
          capture="environment"
          icon={<Camera className="h-5 w-5" aria-hidden="true" />}
          onFilesSelected={setCameraPhotos}
        />
        <PhotoInput
          name="photos"
          label="Choose photos"
          multiple
          icon={<ImagePlus className="h-5 w-5" aria-hidden="true" />}
          onFilesSelected={setChosenPhotos}
        />
      </div>

      <div className="mt-4">
        <SelectedImagePreview
          files={selectedPhotos}
          actionLabel="Will upload when project is saved"
        />
      </div>
    </section>
  );
}

function PhotoInput({
  name,
  label,
  icon,
  capture,
  multiple,
  onFilesSelected,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  capture?: "user" | "environment";
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white">
      {icon}
      {label}
      <input
        className="sr-only"
        type="file"
        name={name}
        accept="image/*"
        capture={capture}
        multiple={multiple}
        onChange={async (event) =>
          onFilesSelected(await prepareImageInput(event.currentTarget))
        }
      />
    </label>
  );
}
