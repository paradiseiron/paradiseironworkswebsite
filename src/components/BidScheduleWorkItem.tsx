"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LoaderCircle, Trash2 } from "lucide-react";

export type BidWorkItem = {
  id: string;
  description: string;
  scheduled_value: number | null;
  fabrication_complete: boolean;
  delivery_complete: boolean;
  installation_complete: boolean;
  ready_for_billing: boolean;
  paid: boolean;
  notes: string | null;
  work_status: WorkStatus;
  item_type: "original_contract" | "change_order";
  change_order_number: string | null;
  change_order_approval_status: ChangeOrderStatus | null;
  change_order_approved_at: string | null;
};

type WorkStatus = "not_started" | "fabrication" | "delivery" | "installation" | "ready_for_billing" | "paid";
type ChangeOrderStatus = "proposed" | "pending_approval" | "approved" | "rejected";

type Draft = {
  description: string;
  scheduledValue: string;
  workStatus: WorkStatus;
  notes: string;
  itemType: "original_contract" | "change_order";
  changeOrderNumber: string;
  changeOrderApprovalStatus: ChangeOrderStatus;
  changeOrderApprovedAt: string;
};

export default function BidScheduleWorkItem({ bidId, item, displayNumber, canWrite }: { bidId: string; item: BidWorkItem; displayNumber: number; canWrite: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(item));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (!canWrite) return;
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setState("saving");
    setError("");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/work-items/${encodeURIComponent(item.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Unable to save this work item.");
        setState("saved");
      } catch (saveError) {
        if (controller.signal.aborted) return;
        setState("error");
        setError(saveError instanceof Error ? saveError.message : "Unable to save this work item.");
      }
    }, 550);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bidId, canWrite, draft, item.id]);

  async function remove() {
    if (!window.confirm("Remove this work item? Calendar events connected to it will also be removed.")) return;
    setState("saving");
    const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/work-items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setState("error");
      setError(body?.error || "Unable to remove this work item.");
      return;
    }
    router.refresh();
  }

  const update = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));
  return <div className="rounded-xl border border-white/10 bg-black/15 p-4">
    <div className="mb-3 text-sm font-semibold text-neutral-400">Item {displayNumber}</div>
    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
      <Field label="Work description"><input value={draft.description} onChange={(event) => update({ description: event.target.value })} disabled={!canWrite} className={inputClass} /></Field>
      <Field label="Scheduled value"><CurrencyInput value={draft.scheduledValue} onChange={(scheduledValue) => update({ scheduledValue })} disabled={!canWrite} /></Field>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <Field label="Item type"><SelectWrap><select value={draft.itemType} onChange={(event) => update({ itemType: event.target.value as Draft["itemType"] })} disabled={!canWrite} className={selectClass}><option value="original_contract">Original Contract</option><option value="change_order">Change Order</option></select></SelectWrap></Field>
      {draft.itemType === "change_order" && <>
        <Field label="Change order number"><input value={draft.changeOrderNumber} onChange={(event) => update({ changeOrderNumber: event.target.value })} disabled={!canWrite} placeholder="CO-01" className={inputClass} /></Field>
        <Field label="Approval status"><SelectWrap><select value={draft.changeOrderApprovalStatus} onChange={(event) => update({ changeOrderApprovalStatus: event.target.value as ChangeOrderStatus })} disabled={!canWrite} className={selectClass}><option value="proposed">Proposed</option><option value="pending_approval">Pending Approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></SelectWrap></Field>
        {draft.changeOrderApprovalStatus === "approved" && <Field label="Approval date"><input type="date" value={draft.changeOrderApprovedAt} onChange={(event) => update({ changeOrderApprovedAt: event.target.value })} disabled={!canWrite} className={inputClass} /></Field>}
      </>}
    </div>
    <StatusTrack value={draft.workStatus} disabled={!canWrite} onChange={(workStatus) => update({ workStatus })} />
    <Field label="Notes" className="mt-3 block"><textarea rows={2} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} disabled={!canWrite} className={`${inputClass} h-auto py-2`} /></Field>
    {canWrite && <div className="mt-3 flex min-h-6 items-center justify-between gap-3">
      <button type="button" onClick={() => void remove()} disabled={state === "saving"} className="inline-flex items-center gap-2 text-sm font-semibold text-red-300 disabled:opacity-50"><Trash2 className="h-4 w-4" />Remove</button>
      <span className={`inline-flex items-center gap-1.5 text-xs ${state === "error" ? "text-red-300" : "text-neutral-500"}`}>
        {state === "saving" && <><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Saving…</>}
        {state === "saved" && <><Check className="h-3.5 w-3.5 text-emerald-400" />Saved</>}
        {state === "error" && error}
      </span>
    </div>}
  </div>;
}

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411] disabled:opacity-70";
const selectClass = `${inputClass} appearance-none pr-11`;

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`text-xs text-neutral-400 ${className}`}>{label}{children}</label>;
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return <span className="relative block">{children}<ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-neutral-500" aria-hidden="true" /></span>;
}

function CurrencyInput({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const [focused, setFocused] = useState(false);
  const numericValue = Number(value);
  const displayValue = !focused && /^-?\d+(\.\d+)?$/.test(value) && Number.isFinite(numericValue)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(numericValue)
    : value;
  return <input type="text" inputMode="decimal" value={displayValue} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const next = event.target.value.replace(/[$,\s]/g, ""); if (/^-?\d*(\.\d{0,2})?$/.test(next)) onChange(next); }} disabled={disabled} className={inputClass} />;
}

export function NewScheduleCurrencyInput() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const numericValue = Number(value);
  const displayValue = !focused && /^-?\d+(\.\d+)?$/.test(value) && Number.isFinite(numericValue)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(numericValue)
    : value;
  return <input name="scheduled_value" type="text" inputMode="decimal" value={displayValue} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => { const next = event.target.value.replace(/[$,\s]/g, ""); if (/^-?\d*(\.\d{0,2})?$/.test(next)) setValue(next); }} placeholder="$0.00" className={inputClass} />;
}

function toDraft(item: BidWorkItem): Draft {
  return {
    description: item.description,
    scheduledValue: item.scheduled_value === null ? "" : String(item.scheduled_value),
    workStatus: item.work_status || statusFromLegacyFields(item), notes: item.notes || "",
    itemType: item.item_type || "original_contract", changeOrderNumber: item.change_order_number || "",
    changeOrderApprovalStatus: item.change_order_approval_status || "proposed",
    changeOrderApprovedAt: item.change_order_approved_at || "",
  };
}

const STATUSES: Array<{ value: WorkStatus; label: string }> = [
  { value: "not_started", label: "Not Started" },
  { value: "fabrication", label: "Fabrication" },
  { value: "delivery", label: "Delivery" },
  { value: "installation", label: "Installation" },
  { value: "ready_for_billing", label: "Ready for Billing" },
  { value: "paid", label: "Paid" },
];

function StatusTrack({ value, disabled, onChange }: { value: WorkStatus; disabled: boolean; onChange: (value: WorkStatus) => void }) {
  const selectedIndex = STATUSES.findIndex((status) => status.value === value);
  return <fieldset className="mt-5" disabled={disabled}>
    <legend className="mb-3 text-xs uppercase tracking-[0.14em] text-neutral-500">Work status</legend>
    <div className="overflow-x-auto pb-1">
      <div className="relative flex min-w-[760px] items-center justify-between">
        <div className="absolute left-[7%] right-[7%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute left-[7%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#fb5411] transition-[width] duration-300" style={{ width: `${(selectedIndex / (STATUSES.length - 1)) * 86}%` }} />
        {STATUSES.map((status, index) => {
          const selected = status.value === value;
          const reached = index <= selectedIndex;
          return <button key={status.value} type="button" onClick={() => onChange(status.value)} aria-pressed={selected} className={`relative z-10 min-w-[108px] rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[#fb5411] bg-[#fb5411] text-white shadow-[0_0_0_4px_rgba(251,84,17,0.14)]" : reached ? "border-[#fb5411]/60 bg-neutral-950 text-[#ff8a5b]" : "border-white/15 bg-neutral-950 text-neutral-500 hover:border-white/30 hover:text-neutral-300"}`}>{status.label}</button>;
        })}
      </div>
    </div>
  </fieldset>;
}

function statusFromLegacyFields(item: BidWorkItem): WorkStatus {
  if (item.paid) return "paid";
  if (item.ready_for_billing) return "ready_for_billing";
  if (item.installation_complete) return "installation";
  if (item.delivery_complete) return "delivery";
  if (item.fabrication_complete) return "fabrication";
  return "not_started";
}
