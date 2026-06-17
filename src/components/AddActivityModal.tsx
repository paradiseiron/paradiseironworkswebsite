"use client";

import { useState } from "react";

export default function AddProjectActivityModal({
  projectId,
  hasOpenFollowUp = false,
  currentFollowUpNote = "",
  currentFollowUpDueAt = "",
  action,
}: {
  projectId: string;
  hasOpenFollowUp?: boolean;
  currentFollowUpNote?: string | null;
  currentFollowUpDueAt?: string | null;
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [requiresFollowUp, setRequiresFollowUp] = useState(
    Boolean(hasOpenFollowUp)
  );

  const dueDateValue = currentFollowUpDueAt
    ? new Date(currentFollowUpDueAt).toISOString().slice(0, 10)
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[#fb5411] hover:text-[#e64d0f]"
      >
        + add activity
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add Activity</h3>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form action={action} className="mt-6 space-y-5">
              <input type="hidden" name="project_id" value={projectId} />

              <div>
                <label className="mb-2 block text-sm text-neutral-300">
                  Activity Type
                </label>

                <div className="relative">
                  <select
                    name="activity_type"
                    defaultValue="note"
                    className="w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 pr-14 text-white outline-none focus:border-[#fb5411]"
                  >
                    <option value="call">Call</option>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="follow_up">Follow-Up</option>
                    <option value="status_change">Status Change</option>
                    <option value="invoice_sent">Invoice Sent</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="note">Note</option>
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-white/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">
                  Summary
                </label>

                <textarea
                  name="summary"
                  required
                  rows={4}
                  placeholder="Example: Called customer and provided updated information."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="requires_follow_up"
                    checked={requiresFollowUp}
                    onChange={(e) => setRequiresFollowUp(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-neutral-900 text-[#fb5411] focus:ring-[#fb5411]"
                  />

                  <span className="text-sm text-white">
                    Requires Follow-Up
                  </span>
                </label>

                {requiresFollowUp && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-neutral-300">
                        Follow-Up Note
                      </label>

                      <textarea
                        name="follow_up_note"
                        rows={3}
                        defaultValue={currentFollowUpNote || ""}
                        placeholder="What still needs to be handled?"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-neutral-300">
                        Follow-Up Due Date
                      </label>

                      <input
                        type="date"
                        name="follow_up_due_at"
                        defaultValue={dueDateValue}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}