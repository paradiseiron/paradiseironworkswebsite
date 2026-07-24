"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SelectedImagePreview({
  files,
  actionLabel = "Ready to upload",
}: {
  files: File[];
  actionLabel?: string;
}) {
  if (!files.length) return null;

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {files.length} {files.length === 1 ? "photo" : "photos"} selected
          · {actionLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((file, index) => (
          <SelectedImageCard
            key={`${file.name}-${file.lastModified}-${index}`}
            file={file}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function SelectedImageCard({ file, index }: { file: File; index: number }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Selected: ${file.name}`}
        className="aspect-square w-full object-cover"
      />
      <div className="px-2.5 py-2">
        <p className="truncate text-xs font-medium text-neutral-200">
          {file.name || `Photo ${index + 1}`}
        </p>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
