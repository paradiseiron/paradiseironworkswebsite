"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Phone, X } from "lucide-react";
import AddProjectActivityModal from "@/components/AddProjectActivityModal";
import {
  formatWashingtonDate,
  formatWashingtonDateTime,
} from "@/lib/date-time";
import type { UserRole } from "@/lib/roles";
import SiteVisitPanel from "@/components/SiteVisitPanel";

type ProjectTab =
  | "overview"
  | "proposal"
  | "site-visit"
  | "timeline"
  | "invoice";

type ProjectRecord = {
  id: string;
  customer_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  lead_source?: string | null;
  project_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  project_category?: string | null;
  status?: string | null;
  notes?: string | null;
  received_at?: string | null;
  has_open_follow_up?: boolean | null;
  latest_follow_up_note?: string | null;
  latest_follow_up_due_at?: string | null;
  proposal_number?: string | null;
  proposal_amount?: number | null;
  proposal_project_name?: string | null;
  proposal_attention?: string | null;
  proposal_office_phone?: string | null;
  proposal_cell_phone?: string | null;
  proposal_email?: string | null;
  proposal_intro?: string | null;
  proposal_scope?: string | null;
  proposal_finish?: string | null;
  proposal_exclusions?: string | null;
  proposal_pricing?: string | null;
  proposal_deposit_amount?: number | null;
  proposal_payment_terms?: string | null;
  proposal_schedule?: string | null;
  proposal_clarifications?: string | null;
  proposal_prepared_by?: string | null;
  proposal_prepared_by_title?: string | null;
  site_visit_status?: string | null;
  site_visit_scheduled_date?: string | null;
  site_visit_window_start?: string | null;
  site_visit_window_end?: string | null;
  site_visit_location?: string | null;
  site_visit_admin_notes?: string | null;
  site_visit_scope_observations?: string | null;
  site_visit_notes?: string | null;
  site_visit_exclusion_notes?: string | null;
  site_visit_access_safety_concerns?: string | null;
  site_visit_completed_at?: string | null;
};

type ProjectActivity = {
  id: string;
  activity_type?: string | null;
  summary?: string | null;
  activity_date?: string | null;
  requires_follow_up?: boolean | null;
  follow_up_note?: string | null;
};

type Props = {
  project: ProjectRecord;
  activities: ProjectActivity[] | null;
  updateProjectStatus: (formData: FormData) => void;
  updateProposal: (formData: FormData) => void;
  addProjectActivity: (formData: FormData) => void;
  role: UserRole;
  siteVisitImages: { path: string; url: string }[];
};

export default function ProjectDetailTabs({
  project,
  activities,
  updateProjectStatus,
  updateProposal,
  addProjectActivity,
  role,
  siteVisitImages,
}: Props) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const initialToast =
    searchParams.get("toast") === "status-updated"
      ? "Project status updated successfully."
      : "";

  const [tab, setTab] = useState<ProjectTab>(
    initialTab === "proposal" ||
      initialTab === "site-visit" ||
      initialTab === "timeline" ||
      initialTab === "invoice"
      ? initialTab
      : "overview"
  );
  const [toast, setToast] = useState(initialToast);
  const [toastVisible, setToastVisible] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!toast) return;

    const showTimer = window.setTimeout(() => setToastVisible(true), 20);
    const hideTimer = window.setTimeout(() => setToastVisible(false), 3500);
    const removeTimer = window.setTimeout(() => {
      setToast("");
      const params = new URLSearchParams(window.location.search);
      params.delete("toast");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    }, 3800);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [toast]);

  useEffect(() => {
    const form = document.getElementById(
      "proposal-form"
    ) as HTMLFormElement | null;
    if (!form) return;

    const save = async (keepalive = false, updateStatus = true) => {
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }

      if (updateStatus) setAutosaveStatus("saving");

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(project.id)}/proposal-draft`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proposalDraftFromForm(form)),
            keepalive,
          }
        );

        if (updateStatus) {
          setAutosaveStatus(response.ok ? "saved" : "error");
        }
      } catch {
        if (updateStatus) setAutosaveStatus("error");
      }
    };

    const scheduleSave = () => {
      setAutosaveStatus("saving");
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
      }
      autosaveTimer.current = window.setTimeout(() => save(), 900);
    };

    const flushSave = () => {
      if (autosaveTimer.current !== null) void save(true, false);
    };

    const stopAutosave = () => {
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };

    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    form.addEventListener("submit", stopAutosave);
    window.addEventListener("pagehide", flushSave);

    return () => {
      flushSave();
      stopAutosave();
      form.removeEventListener("input", scheduleSave);
      form.removeEventListener("change", scheduleSave);
      form.removeEventListener("submit", stopAutosave);
      window.removeEventListener("pagehide", flushSave);
    };
  }, [project.id, tab]);

  function dismissToast() {
    setToastVisible(false);
    window.setTimeout(() => {
      setToast("");
      const params = new URLSearchParams(window.location.search);
      params.delete("toast");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    }, 300);
  }

  function handleTabChange(nextTab: ProjectTab) {
    setTab(nextTab);

    if (nextTab === "overview") {
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      window.history.replaceState(null, "", `?tab=${nextTab}`);
    }
  }

  return (
    <div>
      {toast && (
        <div
          role="status"
          className={`fixed left-4 right-4 top-20 z-50 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-neutral-900 p-4 text-emerald-100 shadow-2xl transition-all duration-300 sm:left-auto sm:right-6 sm:top-24 sm:w-[min(420px,calc(100vw-3rem))] ${
            toastVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0"
          }`}
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <p className="flex-1 text-sm font-medium">{toast}</p>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="cursor-pointer rounded-md p-0.5 text-emerald-200/60 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10">
        {(
          [
            "overview",
            "site-visit",
            "proposal",
            "timeline",
            "invoice",
          ] as ProjectTab[]
        ).map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleTabChange(item)}
              className={`shrink-0 px-3 py-3 text-sm capitalize sm:px-4 ${
                tab === item
                  ? "border-b-2 border-[#fb5411] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {item.replaceAll("-", " ")}
            </button>
          )
        )}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Project Details</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Detail
                label="Contact Name"
                value={project.contact_name || project.customer_name}
              />
              <PhoneDetail projectId={project.id} value={project.phone} />
              <Detail label="Email" value={project.email} />
              <Detail label="Source" value={project.lead_source} />
              <Detail label="Address" value={project.project_address} />
              <Detail label="City" value={project.city} />
              <Detail label="State" value={project.state} />
              <Detail label="ZIP" value={project.zip_code} />

              <Detail
                label="Received"
                value={
                  project.received_at
                    ? formatWashingtonDate(project.received_at)
                    : null
                }
              />

              <Detail
                label="Proposal #"
                value={project.proposal_number || "Not assigned"}
              />

              <Detail
                label="Proposal Amount"
                value={
                  project.proposal_amount
                    ? `$${Number(project.proposal_amount).toLocaleString()}`
                    : null
                }
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Status</h2>

              <form action={updateProjectStatus} className="mt-4">
                <input type="hidden" name="project_id" value={project.id} />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <select
                      name="status"
                      defaultValue={project.status || "lead"}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 pr-12 text-white outline-none focus:border-[#fb5411]"
                    >
                      <option value="lead">Lead</option>
                      <option value="quoted">Quoted</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="lost">Lost</option>
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 12h16"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4l8 8-8 8"
                      />
                    </svg>

                    <span>Update</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Notes</h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                {project.notes || "No notes yet."}
              </p>
            </section>
          </aside>
        </div>
      )}

      {tab === "proposal" && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Proposal Draft</h2>

              <p className="mt-1 text-sm text-neutral-400">
                Draft/edit proposal details. Proposal number is assigned once an
                amount is saved.
              </p>
            </div>

            <div className="text-right text-sm text-neutral-400">
              <p>
                Proposal #:{" "}
                <span className="text-white">
                  {project.proposal_number || "Not assigned"}
                </span>
              </p>
              <p
                className={`mt-1 text-xs ${
                  autosaveStatus === "error"
                    ? "text-red-300"
                    : autosaveStatus === "saved"
                      ? "text-emerald-400"
                      : "text-neutral-500"
                }`}
              >
                {autosaveStatus === "saving"
                  ? "Saving draft…"
                  : autosaveStatus === "saved"
                    ? "Draft saved"
                    : autosaveStatus === "error"
                      ? "Draft not saved"
                      : "Autosave on"}
              </p>
            </div>
          </div>

          <form
            id="proposal-form"
            action={updateProposal}
            className="mt-6 space-y-5"
          >
            <input type="hidden" name="project_id" value={project.id} />
            <input
              type="hidden"
              name="project_category"
              value={project.project_category || ""}
            />
            <input
              type="hidden"
              name="existing_proposal_number"
              value={project.proposal_number || ""}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Project Name"
                name="proposal_project_name"
                defaultValue={
                  project.proposal_project_name || project.customer_name || ""
                }
              />

              <Field
                label="Attention"
                name="proposal_attention"
                defaultValue={
                  project.proposal_attention || project.contact_name || ""
                }
              />

              <Field
                label="Office Phone"
                name="proposal_office_phone"
                defaultValue={project.proposal_office_phone || ""}
              />

              <Field
                label="Cell Phone"
                name="proposal_cell_phone"
                defaultValue={project.proposal_cell_phone || project.phone || ""}
              />

              <Field
                label="Proposal Email"
                name="proposal_email"
                type="email"
                defaultValue={project.proposal_email || project.email || ""}
              />

              <Field
                label="Proposal Amount"
                name="proposal_amount"
                type="number"
                defaultValue={project.proposal_amount || ""}
              />

              <Field
                label="Deposit Amount"
                name="proposal_deposit_amount"
                type="number"
                defaultValue={project.proposal_deposit_amount || ""}
              />
            </div>

            <TextArea
              label="Intro"
              name="proposal_intro"
              defaultValue={project.proposal_intro || ""}
              rows={3}
            />

            <TextArea
              label="Scope of Work"
              name="proposal_scope"
              defaultValue={project.proposal_scope || ""}
              rows={6}
            />

            <TextArea
              label="Finish"
              name="proposal_finish"
              defaultValue={project.proposal_finish || ""}
              rows={3}
            />

            <TextArea
              label="Exclusions"
              name="proposal_exclusions"
              defaultValue={project.proposal_exclusions || ""}
              rows={4}
            />

            <TextArea
              label="Pricing"
              name="proposal_pricing"
              defaultValue={project.proposal_pricing || ""}
              rows={4}
            />

            <TextArea
              label="Payment Terms"
              name="proposal_payment_terms"
              defaultValue={project.proposal_payment_terms || ""}
              rows={3}
            />

            <TextArea
              label="Schedule"
              name="proposal_schedule"
              defaultValue={project.proposal_schedule || ""}
              rows={3}
            />

            <TextArea
              label="Clarifications"
              name="proposal_clarifications"
              defaultValue={project.proposal_clarifications || ""}
              rows={4}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Prepared By"
                name="proposal_prepared_by"
                defaultValue={project.proposal_prepared_by || "Ronald Brown"}
              />

              <Field
                label="Prepared By Title"
                name="proposal_prepared_by_title"
                defaultValue={
                  project.proposal_prepared_by_title ||
                  "Operations & Estimating Director"
                }
              />
            </div>
          </form>
        </section>
      )}

      {tab === "site-visit" && (
        <SiteVisitPanel
          project={project}
          role={role}
          images={siteVisitImages}
        />
      )}

      {tab === "timeline" && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Project Timeline</h2>

            <AddProjectActivityModal
              projectId={project.id}
              hasOpenFollowUp={Boolean(project.has_open_follow_up)}
              currentFollowUpNote={project.latest_follow_up_note}
              currentFollowUpDueAt={project.latest_follow_up_due_at}
              action={addProjectActivity}
            />
          </div>

          <div className="mt-6 space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <p className="font-medium capitalize text-white">
                    {(activity.activity_type || "activity").replaceAll("_", " ")}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {activity.activity_date
                      ? formatWashingtonDateTime(activity.activity_date)
                      : "No date"}
                  </p>

                  {activity.requires_follow_up && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      <span>Follow-up required</span>
                    </div>
                  )}

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                    {activity.summary}
                  </p>

                  {activity.follow_up_note && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-200/80">
                      {activity.follow_up_note}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-400">
                No project activity yet.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "invoice" && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Invoice</h2>

          {["active", "completed"].includes(project.status || "") ? (
            <div className="mt-4">
              <p className="text-sm text-neutral-400">
                Invoice creation will live here. This should unlock once the job
                is active or completed.
              </p>

              <button
                type="button"
                disabled
                className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-500"
              >
                Generate Invoice later
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-400">
              Invoice tools become available once this project is active or
              completed.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function proposalDraftFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  return Object.fromEntries(
    [...formData.entries()]
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value])
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-neutral-200">{value || "—"}</p>
    </div>
  );
}

function PhoneDetail({
  projectId,
  value,
}: {
  projectId: string;
  value?: string | null;
}) {
  const dialableNumber = value?.replace(/[^\d+]/g, "");

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        Phone
      </p>

      {value && dialableNumber ? (
        <a
          href={`tel:${dialableNumber}`}
          onClick={() => {
            void fetch(
              `/api/projects/${encodeURIComponent(projectId)}/call-events`,
              {
                method: "POST",
                keepalive: true,
              }
            );
          }}
          className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-[#fb5411] hover:text-[#ff6a2b]"
          aria-label={`Call ${value}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {value}
        </a>
      ) : (
        <p className="mt-1 text-neutral-200">—</p>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-300">{label}</label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        step={type === "number" ? "0.01" : undefined}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue = "",
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-300">{label}</label>

      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}
