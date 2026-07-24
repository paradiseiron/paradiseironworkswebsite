"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type ReportImage = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName?: string | null;
};

export default function DailyShopReportImageGallery({
  reportId,
  images,
  canRemove,
}: {
  reportId: string;
  images: ReportImage[];
  canRemove: boolean;
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  async function removePhoto(imageId: string) {
    if (!window.confirm("Remove this report photo permanently?")) return;
    setRemovingId(imageId);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/daily-shop-reports/${encodeURIComponent(reportId)}/images/${encodeURIComponent(imageId)}`,
        { method: "DELETE" }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error || "Unable to remove report photo.");
      }
      router.refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove report photo."
      );
    } finally {
      setRemovingId("");
    }
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900"
          >
            <a href={image.url} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.fileName || "Daily shop report"}
                className="aspect-square w-full object-cover"
              />
            </a>
            {canRemove && (
              <button
                type="button"
                onClick={() => removePhoto(image.id)}
                disabled={Boolean(removingId)}
                aria-label={`Remove ${image.fileName || "report photo"}`}
                title="Remove photo"
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/30 bg-neutral-950/90 text-red-300 shadow-lg disabled:cursor-wait disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </>
  );
}
