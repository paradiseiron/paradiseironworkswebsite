"use client";

import { useState } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";

export default function PdfFileAction({
  href,
  label = "Download PDF",
  compactLabel = "PDF",
  className = "",
}: {
  href: string;
  label?: string;
  compactLabel?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFileAction() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(href, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error((await response.text()) || "Unable to generate PDF.");
      }

      const blob = await response.blob();
      const filename =
        filenameFromDisposition(response.headers.get("content-disposition")) ||
        "paradise-document.pdf";
      const file = new File([blob], filename, { type: "application/pdf" });
      const isMobile =
        window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
        navigator.maxTouchPoints > 1;
      const canShareFile =
        isMobile &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            title: filename.replace(/\.pdf$/i, ""),
            files: [file],
          });
          return;
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === "AbortError"
          ) {
            return;
          }
          console.warn("Native PDF sharing was unavailable:", shareError);
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to prepare the PDF file."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleFileAction}
      disabled={busy}
      className={`inline-flex h-10 items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60 ${className}`}
      aria-label={label}
      title={label}
    >
      {busy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          <Download
            className="hidden h-4 w-4 [@media(hover:hover)]:block"
            aria-hidden="true"
          />
          <Share2
            className="h-4 w-4 [@media(hover:hover)]:hidden"
            aria-hidden="true"
          />
        </>
      )}
      <span className="hidden sm:inline">{busy ? "Preparing…" : label}</span>
      <span className="sm:hidden">{busy ? "Preparing…" : compactLabel}</span>
    </button>
  );
}

function filenameFromDisposition(disposition: string | null) {
  if (!disposition) return "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || "";
}
