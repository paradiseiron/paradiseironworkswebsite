"use client";

import { useState } from "react";
import { formatCalendarDate } from "@/lib/date-time";

export default function FollowUpAlertModal({
  projectId,
  note,
  dueAt,
  returnPath,
  action,
}: {
  projectId: string;
  note?: string | null;
  dueAt?: string | null;
  returnPath: string;
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/15"
      >
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span>Needs Follow-Up</span>

        {dueAt && (
          <span className="text-red-200/60">
            · Due {formatCalendarDate(dueAt)}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:px-4">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-4 text-white shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Follow-Up Alert</h3>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="font-medium text-red-300">Needs Follow-Up</p>

              <p className="mt-2 whitespace-pre-wrap">
                {note || "No follow-up details were provided."}
              </p>

              {dueAt && (
                <p className="mt-3 text-red-200/70">
                  Due {formatCalendarDate(dueAt)}
                </p>
              )}
            </div>

            <form action={action} className="mt-5 space-y-4">
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="return_path" value={returnPath} />

              <div>
                <label className="mb-2 block text-sm text-neutral-300">
                  Resolution Note
                </label>

                <textarea
                  name="resolution_note"
                  rows={3}
                  placeholder="Example: Sent revised dimensions and pricing to customer."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#fb5411] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e64d0f]"
                >
                  Resolve Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
