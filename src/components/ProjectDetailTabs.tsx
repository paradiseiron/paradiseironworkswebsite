"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  List,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import AddProjectActivityModal from "@/components/AddProjectActivityModal";
import {
  formatWashingtonDate,
  formatWashingtonDateTime,
} from "@/lib/date-time";
import type { UserRole } from "@/lib/roles";
import SiteVisitPanel from "@/components/SiteVisitPanel";
import ProjectImagesPanel, {
  type ProjectImage,
} from "@/components/ProjectImagesPanel";
import {
  formatCurrency,
  normalizeProposalPricingItems,
  parseProposalPricingItemsFromForm,
  proposalPricingTotal,
  type ProposalPricingLineItem,
} from "@/lib/proposal-pricing";
import { getInvoiceLineItems, getInvoiceSummary } from "@/lib/invoice";
import PdfFileAction from "@/components/PdfFileAction";

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
  project_type?: string | null;
  engineering_services?: string | null;
  status?: string | null;
  notes?: string | null;
  received_at?: string | null;
  has_open_follow_up?: boolean | null;
  latest_follow_up_note?: string | null;
  latest_follow_up_due_at?: string | null;
  proposal_number?: string | null;
  proposal_amount?: number | null;
  balance_due?: number | null;
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
  proposal_pricing_items?: unknown;
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
  site_visit_assigned_to?: string | null;
};

type ProjectActivity = {
  id: string;
  activity_type?: string | null;
  summary?: string | null;
  activity_date?: string | null;
  requires_follow_up?: boolean | null;
  follow_up_note?: string | null;
};

type PricingLineItemFormState = {
  id: string;
  description: string;
  amount: string;
  price: string;
};

type Props = {
  project: ProjectRecord;
  activities: ProjectActivity[] | null;
  updateProjectStatus: (formData: FormData) => void;
  updateProposal: (formData: FormData) => void;
  addProjectActivity: (formData: FormData) => void;
  role: UserRole;
  siteVisitImages: { path: string; url: string }[];
  projectImages: ProjectImage[];
  estimators: { id: string; name: string }[];
};

export default function ProjectDetailTabs({
  project,
  activities,
  updateProjectStatus,
  updateProposal,
  addProjectActivity,
  role,
  siteVisitImages,
  projectImages,
  estimators,
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
  const [pricingItems, setPricingItems] = useState<PricingLineItemFormState[]>(
    () =>
      pricingItemsToFormState(
        normalizeProposalPricingItems(
          project.proposal_pricing_items,
          project.proposal_amount,
          project.proposal_pricing
        )
      )
  );
  const autosaveTimer = useRef<number | null>(null);
  const pricingTotal = proposalPricingTotal(
    pricingFormStateToLineItems(pricingItems)
  );
  const canWrite =
    role === "admin" ||
    role === "estimator" ||
    role === "operations_foreman";

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

  function showToast(message: string) {
    setToastVisible(false);
    setToast("");
    window.setTimeout(() => setToast(message), 20);
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
              <PhoneDetail
                projectId={project.id}
                value={project.phone}
                logActivity={canWrite}
              />
              <Detail label="Email" value={project.email} />
              <Detail label="Source" value={project.lead_source} />
              <Detail label="Project Type" value={project.project_type} />
              <Detail
                label="Engineering Services"
                value={project.engineering_services || "Not required"}
              />
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

              {canWrite ? (
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
              ) : (
                <p className="mt-4 text-sm capitalize text-neutral-300">
                  {project.status || "lead"}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Notes</h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                {project.notes || "No notes yet."}
              </p>
            </section>
          </aside>

          <ProjectImagesPanel
            projectId={project.id}
            images={projectImages}
            readOnly={!canWrite}
          />
        </div>
      )}

      {tab === "proposal" && (
        canWrite ? (
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

            <PricingLineItems
              items={pricingItems}
              total={pricingTotal}
              onChange={setPricingItems}
            />

            <DepositAndPaymentTerms
              total={pricingTotal}
              initialDeposit={project.proposal_deposit_amount}
              initialPaymentTerms={project.proposal_payment_terms || ""}
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
        ) : (
          <ProposalReadOnlyPanel project={project} pricingTotal={pricingTotal} />
        )
      )}

      {tab === "site-visit" && (
        <SiteVisitPanel
          project={project}
          role={role}
          images={siteVisitImages}
          estimators={estimators}
          onToast={showToast}
        />
      )}

      {tab === "timeline" && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Project Timeline</h2>

            {canWrite && (
              <AddProjectActivityModal
                projectId={project.id}
                hasOpenFollowUp={Boolean(project.has_open_follow_up)}
                currentFollowUpNote={project.latest_follow_up_note}
                currentFollowUpDueAt={project.latest_follow_up_due_at}
                action={addProjectActivity}
              />
            )}
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
          {["active", "completed"].includes(project.status || "") ? (
            <InvoicePanel project={project} />
          ) : (
            <>
              <h2 className="text-xl font-semibold">Invoice</h2>
              <p className="mt-4 text-sm text-neutral-400">
                Invoice tools become available once this project is active or
                completed.
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function InvoicePanel({ project }: { project: ProjectRecord }) {
  const summary = getInvoiceSummary(project);
  const lineItems = getInvoiceLineItems(summary);
  const projectLabel = project.proposal_project_name || project.customer_name;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Invoice</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Standard invoice based on the current remaining balance.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
            Balance Due
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-100">
            {formatCurrency(summary.amountDue)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InvoiceMetric label="Invoice #" value={summary.invoiceNumber} />
        <InvoiceMetric
          label="Contract Amount"
          value={formatCurrency(summary.contractAmount)}
        />
        <InvoiceMetric
          label="Paid / Credited"
          value={formatCurrency(summary.paidToDate)}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <div className="grid grid-cols-[1fr_140px] bg-white/[0.04] text-sm font-semibold text-neutral-200">
          <div className="border-r border-white/10 px-4 py-3">Description</div>
          <div className="px-4 py-3 text-right">Amount</div>
        </div>

        {lineItems.map((item) => (
          <div
            key={item.description}
            className="grid grid-cols-[1fr_140px] border-t border-white/10 text-sm"
          >
            <div className="border-r border-white/10 px-4 py-3 text-neutral-300">
              {item.description}
            </div>
            <div className="px-4 py-3 text-right text-white">
              {formatCurrency(item.amount)}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-[1fr_140px] border-t border-white/20 bg-white/[0.04] text-sm font-bold">
          <div className="px-4 py-3 text-right text-white">Total Due</div>
          <div className="border-l border-white/10 px-4 py-3 text-right text-white">
            {formatCurrency(summary.amountDue)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-neutral-300">
        <p>
          <span className="font-semibold text-white">Bill to:</span>{" "}
          {project.contact_name || project.customer_name || "—"}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-white">Project:</span>{" "}
          {projectLabel || "—"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/admin/projects/${project.id}/invoice`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>Preview Invoice</span>
        </Link>

        <PdfFileAction
          href={`/admin/projects/${project.id}/invoice/pdf`}
          label="Download PDF"
          className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:bg-white/5 hover:text-white"
        />
      </div>
    </div>
  );
}

function InvoiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function ProposalReadOnlyPanel({
  project,
  pricingTotal,
}: {
  project: ProjectRecord;
  pricingTotal: number;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Proposal</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Read-only proposal details. Viewers can preview or download the
            proposal.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/projects/${project.id}/proposal`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Preview Proposal</span>
          </Link>
          <PdfFileAction
            href={`/admin/projects/${project.id}/proposal/pdf`}
            label="Download PDF"
            className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:bg-white/5 hover:text-white"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InvoiceMetric
          label="Proposal #"
          value={project.proposal_number || "Not assigned"}
        />
        <InvoiceMetric
          label="Proposal Amount"
          value={formatCurrency(pricingTotal || Number(project.proposal_amount || 0))}
        />
        <InvoiceMetric
          label="Prepared By"
          value={project.proposal_prepared_by || "—"}
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Detail
          label="Project Name"
          value={project.proposal_project_name || project.customer_name}
        />
        <Detail
          label="Attention"
          value={project.proposal_attention || project.contact_name}
        />
        <Detail label="Scope of Work" value={project.proposal_scope} />
        <Detail
          label="Deposit Amount"
          value={
            project.proposal_deposit_amount
              ? formatCurrency(Number(project.proposal_deposit_amount))
              : null
          }
        />
        <Detail label="Payment Terms" value={project.proposal_payment_terms} />
        <Detail label="Schedule" value={project.proposal_schedule} />
        <Detail
          label="Clarifications"
          value={project.proposal_clarifications}
        />
      </div>
    </section>
  );
}

function proposalDraftFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  return {
    ...Object.fromEntries(
      [...formData.entries()]
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, value])
    ),
    proposal_pricing_items: parseProposalPricingItemsFromForm(formData),
  };
}

function PricingLineItems({
  items,
  total,
  onChange,
}: {
  items: PricingLineItemFormState[];
  total: number;
  onChange: (items: PricingLineItemFormState[]) => void;
}) {
  function updateItem(
    index: number,
    field: keyof Omit<PricingLineItemFormState, "id">,
    value: string
  ) {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    onChange([
      ...items,
      {
        id: `new-${Date.now()}-${items.length}`,
        description: "",
        amount: "1",
        price: "",
      },
    ]);
    notifyFormChanged();
  }

  function removeItem(index: number) {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(
      nextItems.length
        ? nextItems
        : [{ id: "empty-0", description: "", amount: "1", price: "" }]
    );
    notifyFormChanged();
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Pricing</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Total is calculated from amount multiplied by price.
          </p>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add line item</span>
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[minmax(260px,1fr)_120px_160px_44px] gap-3 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            <span>Description</span>
            <span>Amount</span>
            <span>Price</span>
            <span className="sr-only">Remove</span>
          </div>

          <div className="space-y-3 pt-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(260px,1fr)_120px_160px_44px] gap-3"
              >
                <input
                  name="proposal_pricing_description"
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, "description", event.target.value)
                  }
                  className="h-11 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
                />
                <input
                  name="proposal_pricing_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  onChange={(event) =>
                    updateItem(index, "amount", event.target.value)
                  }
                  className="h-11 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
                />
                <input
                  name="proposal_pricing_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(event) =>
                    updateItem(index, "price", event.target.value)
                  }
                  className="h-11 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label="Remove line item"
                  title="Remove line item"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-white">
          Total: <span className="text-[#fb5411]">{formatCurrency(total)}</span>
        </p>
      </div>
    </section>
  );
}

type DepositChoice = "30" | "50" | "manual";

function DepositAndPaymentTerms({
  total,
  initialDeposit,
  initialPaymentTerms,
}: {
  total: number;
  initialDeposit?: number | null;
  initialPaymentTerms: string;
}) {
  const initialChoice = initialDepositChoice(initialDeposit, total);
  const [choice, setChoice] = useState<DepositChoice>(() =>
    initialChoice
  );
  const [manualAmount, setManualAmount] = useState(() =>
    initialChoice === "manual" && initialDeposit
      ? String(initialDeposit)
      : ""
  );
  const paymentTermsRef = useRef<HTMLTextAreaElement>(null);
  const initialTerms =
    initialPaymentTerms ||
    depositPaymentTerms(
      initialChoice,
      initialChoice === "manual" && initialDeposit
        ? String(initialDeposit)
        : ""
    );
  const percentage = choice === "30" ? 0.3 : choice === "50" ? 0.5 : null;
  const calculatedDeposit =
    percentage === null
      ? optionalPricingNumber(manualAmount)
      : Math.round(total * percentage * 100) / 100;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          Deposit &amp; Payment Terms
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          Choose a percentage of the proposal total or enter a specific deposit.
        </p>
      </div>

      <input
        type="hidden"
        name="proposal_deposit_amount"
        value={calculatedDeposit === null ? "" : calculatedDeposit}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["30", "30% deposit"],
            ["50", "50% deposit"],
            ["manual", "Manual amount"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
              choice === value
                ? "border-[#fb5411] bg-[#fb5411]/10 text-white"
                : "border-white/10 bg-neutral-900 text-neutral-300 hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="proposal_deposit_choice"
              value={value}
              checked={choice === value}
              onChange={() => {
                setChoice(value);
                replacePaymentTerms(
                  paymentTermsRef.current,
                  depositPaymentTerms(value, manualAmount)
                );
              }}
              className="h-4 w-4 cursor-pointer accent-[#fb5411]"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-200">
            Deposit amount
          </span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                choice === "manual"
                  ? manualAmount
                  : calculatedDeposit === null
                    ? ""
                    : calculatedDeposit
              }
              onChange={(event) => {
                const amount = event.target.value;
                setManualAmount(amount);
                replacePaymentTerms(
                  paymentTermsRef.current,
                  depositPaymentTerms("manual", amount)
                );
              }}
              disabled={choice !== "manual"}
              required={choice === "manual"}
              className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 pl-7 pr-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-neutral-400 focus:border-[#fb5411]"
            />
          </div>
        </label>

        <div className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Proposal total
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm text-neutral-300">Payment Terms</label>
          <BulletButton
            onClick={() => {
              const textarea = paymentTermsRef.current;
              if (!textarea) return;
              const result = toggleBulletedLines(
                textarea.value,
                textarea.selectionStart,
                textarea.selectionEnd
              );
              textarea.value = result.value;
              textarea.focus();
              textarea.setSelectionRange(result.start, result.end);
              textarea.dispatchEvent(new Event("input", { bubbles: true }));
            }}
          />
        </div>
        <textarea
          ref={paymentTermsRef}
          name="proposal_payment_terms"
          rows={3}
          defaultValue={initialTerms}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
        />
      </div>
    </section>
  );
}

function replacePaymentTerms(
  textarea: HTMLTextAreaElement | null,
  value: string
) {
  if (!textarea) return;
  textarea.value = value;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function initialDepositChoice(
  deposit: number | null | undefined,
  total: number
): DepositChoice {
  if (!deposit) return "30";
  if (total > 0 && Math.abs(deposit - total * 0.3) < 0.01) return "30";
  if (total > 0 && Math.abs(deposit - total * 0.5) < 0.01) return "50";
  return "manual";
}

function depositPaymentTerms(choice: DepositChoice, manualAmount: string) {
  if (choice === "30") {
    return "30% deposit due upon acceptance. The remaining 70% is due upon completion of the project.";
  }

  if (choice === "50") {
    return "50% deposit due upon acceptance. The remaining 50% is due upon completion of the project.";
  }

  const amount = optionalPricingNumber(manualAmount);
  const deposit = amount === null ? "The specified deposit" : formatCurrency(amount);
  return `${deposit} is due upon acceptance. The remaining balance is due upon completion of the project.`;
}

function pricingItemsToFormState(items: ProposalPricingLineItem[]) {
  return items.map((item, index) => ({
    id: `existing-${index}`,
    description: item.description,
    amount: item.amount === null ? "" : String(item.amount),
    price: item.price === null ? "" : String(item.price),
  }));
}

function pricingFormStateToLineItems(items: PricingLineItemFormState[]) {
  return items.map((item) => ({
    description: item.description,
    amount: optionalPricingNumber(item.amount),
    price: optionalPricingNumber(item.price),
  }));
}

function optionalPricingNumber(value: string) {
  if (value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function notifyFormChanged() {
  window.setTimeout(() => {
    document
      .getElementById("proposal-form")
      ?.dispatchEvent(new Event("input", { bubbles: true }));
  }, 0);
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
  logActivity = true,
}: {
  projectId: string;
  value?: string | null;
  logActivity?: boolean;
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
            if (!logActivity) return;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm text-neutral-300">{label}</label>
        <BulletButton
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const result = toggleBulletedLines(
              textarea.value,
              textarea.selectionStart,
              textarea.selectionEnd
            );
            textarea.value = result.value;
            textarea.focus();
            textarea.setSelectionRange(result.start, result.end);
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
          }}
        />
      </div>

      <textarea
        ref={textareaRef}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function BulletButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      aria-label="Toggle bullet list"
      title="Toggle bullet list"
    >
      <List className="h-4 w-4" aria-hidden="true" />
      <span>Bullets</span>
    </button>
  );
}

function toggleBulletedLines(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextNewline = value.indexOf("\n", end);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const selectedLines = value.slice(lineStart, lineEnd).split("\n");
  const nonEmptyLines = selectedLines.filter((line) => line.trim());
  const removeBullets =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => /^\s*•\s*/.test(line));
  const formatted = selectedLines
    .map((line) => {
      if (!line.trim()) return line;
      return removeBullets ? line.replace(/^\s*•\s*/, "") : `• ${line.replace(/^\s*•\s*/, "")}`;
    })
    .join("\n");

  return {
    value: `${value.slice(0, lineStart)}${formatted}${value.slice(lineEnd)}`,
    start: lineStart,
    end: lineStart + formatted.length,
  };
}
