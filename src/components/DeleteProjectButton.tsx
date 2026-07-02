"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isDeleting]);

  function closeModal() {
    if (isDeleting) return;
    setError("");
    setOpen(false);
  }

  async function deleteProject() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Unable to delete project.");
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete project."
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Delete Project"
        title="Delete Project"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 sm:px-5"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Delete</span>
      </button>

      {open &&
        createPortal(
          <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-description"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-project-title"
                  className="text-xl font-semibold"
                >
                  Delete project?
                </h2>
                <p
                  id="delete-project-description"
                  className="mt-2 text-sm leading-6 text-neutral-300"
                >
                  This project and its record will be permanently deleted. This
                  action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                aria-label="Close"
                className="rounded-lg p-1 text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProject}
                disabled={isDeleting}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isDeleting ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}
