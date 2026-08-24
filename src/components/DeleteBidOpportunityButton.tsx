"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

export default function DeleteBidOpportunityButton({ id }: { id: string }) {
  const router = useRouter();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, deleting]);

  function close() {
    if (deleting) return;
    setError("");
    setOpen(false);
  }

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/bid-opportunities/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Unable to delete bid opportunity.");
      }
      router.push("/admin/bids");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete bid opportunity.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete Bid Opportunity"
        title="Delete Bid Opportunity"
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 sm:px-5"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Delete</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-bid-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-bid-title" className="text-xl font-semibold">Delete bid opportunity?</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  This opportunity and its uploaded documents will be permanently deleted. This action cannot be undone.
                </p>
              </div>
              <button type="button" onClick={close} disabled={deleting} aria-label="Close" className="cursor-pointer rounded-lg p-1 text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" onClick={close} disabled={deleting} className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={remove} disabled={deleting} className="inline-flex min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-60">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deleting ? "Deleting..." : "Delete opportunity"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
