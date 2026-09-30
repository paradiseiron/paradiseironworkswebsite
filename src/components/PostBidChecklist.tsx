"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Circle, Clock3, LoaderCircle, MinusCircle, Plus, Trash2 } from "lucide-react";

export type PostBidChecklistItem = { id: string; task: string; owner_name: string | null; due_date: string | null; status: ChecklistStatus; notes: string | null; is_standard: boolean };
type ChecklistStatus = "not_started" | "in_progress" | "complete" | "not_applicable";
type Draft = { task: string; ownerName: string; dueDate: string; status: ChecklistStatus; notes: string };

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411] disabled:opacity-70";
const STATUSES: Array<{ value: ChecklistStatus; label: string }> = [
  { value: "not_started", label: "Not Started" }, { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" }, { value: "not_applicable", label: "N/A" },
];

export default function PostBidChecklist({ bidId, items: initialItems, canWrite, addAction }: { bidId: string; items: PostBidChecklistItem[]; canWrite: boolean; addAction: (formData: FormData) => void | Promise<void> }) {
  const [items, setItems] = useState(initialItems);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedItemId);
  const resolved = items.filter((item) => item.status === "complete" || item.status === "not_applicable").length;
  const completed = items.filter((item) => item.status === "complete").length;
  const percent = items.length ? Math.round((resolved / items.length) * 100) : 0;
  return <div className="space-y-5">
    {!selectedItem && <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Post-Bid Win Checklist</h2><p className="mt-2 max-w-3xl text-sm text-neutral-400">Complete the administrative handoff before project execution. Changes save automatically.</p></div><div className="min-w-36 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-right"><p className="text-2xl font-semibold text-white">{percent}%</p><p className="text-xs text-neutral-500">{resolved} of {items.length} resolved</p></div></div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#fb5411] transition-all" style={{ width: `${percent}%` }} /></div>
      <div className="mt-3 flex gap-4 text-xs text-neutral-500"><span>{completed} complete</span><span>{items.filter((item) => item.status === "in_progress").length} in progress</span><span>{items.filter((item) => item.status === "not_applicable").length} N/A</span></div>
    </section>}
    {selectedItem ? <div className="space-y-4">
      <button type="button" onClick={() => setSelectedItemId(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Back to full checklist</button>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"><ChecklistCard bidId={bidId} item={selectedItem} displayNumber={items.findIndex((item) => item.id === selectedItem.id) + 1} canWrite={canWrite} onSaved={(status) => setItems((current) => current.map((entry) => entry.id === selectedItem.id ? { ...entry, status } : entry))} onRemoved={() => { setItems((current) => current.filter((entry) => entry.id !== selectedItem.id)); setSelectedItemId(null); }} /></section>
    </div> : <>
      <SimplifiedChecklist items={items} onSelect={setSelectedItemId} />
      {canWrite && <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 sm:p-6"><h3 className="font-semibold">Add checklist item</h3><p className="mt-1 text-sm text-neutral-500">Add requirements specific to this contract, project, GC, or job site.</p><form action={addAction} className="mt-4 rounded-xl border border-white/10 bg-black/15 p-4"><input type="hidden" name="bid_opportunity_id" value={bidId} /><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]"><Field label="Task"><input name="task" required placeholder="Enter a project-specific requirement" className={inputClass} /></Field><Field label="Owner"><input name="owner_name" placeholder="Unassigned" className={inputClass} /></Field><Field label="Due date"><input name="due_date" type="date" className={inputClass} /></Field></div><div className="mt-3 flex justify-end"><button className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add item</button></div></form></section>}
    </>}
  </div>;
}

function SimplifiedChecklist({ items, onSelect }: { items: PostBidChecklistItem[]; onSelect: (id: string) => void }) {
  if (!items.length) return <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"><EmptyChecklist /></section>;
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
    <div className="hidden grid-cols-[44px_minmax(260px,1fr)_180px_150px_150px_24px] gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-xs uppercase tracking-[0.12em] text-neutral-500 md:grid"><span>#</span><span>Task</span><span>Owner</span><span>Due date</span><span>Status</span><span /></div>
    <div className="divide-y divide-white/10">{items.map((item, index) => <button type="button" onClick={() => onSelect(item.id)} key={item.id} className={`grid w-full cursor-pointer gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fb5411] sm:px-5 md:grid-cols-[44px_minmax(260px,1fr)_180px_150px_150px_24px] md:items-center ${item.status === "complete" ? "bg-[#fb5411]/[0.04]" : ""}`}>
      <span className="hidden text-sm text-neutral-500 md:block">{index + 1}</span>
      <div className="flex min-w-0 items-start gap-3"><StatusIcon status={item.status} /><div className="min-w-0"><p className={`text-sm font-medium ${item.status === "complete" || item.status === "not_applicable" ? "text-neutral-400 line-through" : "text-white"}`}>{item.task}</p>{item.notes && <p className="mt-1 truncate text-xs text-neutral-500">{item.notes}</p>}</div></div>
      <p className="pl-7 text-sm text-neutral-400 md:pl-0">{item.owner_name || "Unassigned"}</p>
      <p className="pl-7 text-sm text-neutral-400 md:pl-0">{item.due_date ? formatChecklistDate(item.due_date) : "No due date"}</p>
      <div className="pl-7 md:pl-0"><StatusBadge status={item.status} /></div>
      <ChevronRight className="hidden h-4 w-4 text-neutral-600 md:block" aria-hidden="true" />
    </button>)}</div>
  </section>;
}

function StatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === "complete") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#fb5411]" aria-hidden="true" />;
  if (status === "in_progress") return <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#fb5411]" aria-hidden="true" />;
  if (status === "not_applicable") return <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />;
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" aria-hidden="true" />;
}

function StatusBadge({ status }: { status: ChecklistStatus }) {
  const label = STATUSES.find((option) => option.value === status)?.label || status;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status === "complete" ? "border-[#fb5411]/30 bg-[#fb5411]/10 text-[#ff8a5b]" : status === "in_progress" ? "border-white/15 bg-white/[0.05] text-neutral-300" : "border-white/10 text-neutral-500"}`}>{label}</span>;
}

function EmptyChecklist() { return <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">No checklist items have been entered.</p>; }

function formatChecklistDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }

function ChecklistCard({ bidId, item, displayNumber, canWrite, onSaved, onRemoved }: { bidId: string; item: PostBidChecklistItem; displayNumber: number; canWrite: boolean; onSaved: (status: ChecklistStatus) => void; onRemoved: () => void }) {
  const [draft, setDraft] = useState<Draft>({ task: item.task, ownerName: item.owner_name || "", dueDate: item.due_date || "", status: item.status, notes: item.notes || "" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const initialized = useRef(false);
  const savedCallback = useRef(onSaved);
  useEffect(() => { savedCallback.current = onSaved; }, [onSaved]);
  useEffect(() => {
    if (!canWrite) return;
    if (!initialized.current) { initialized.current = true; return; }
    setState("saving"); setError("");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/checklist-items/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft), signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Unable to save this checklist item.");
        setState("saved"); savedCallback.current(draft.status);
      } catch (saveError) { if (controller.signal.aborted) return; setState("error"); setError(saveError instanceof Error ? saveError.message : "Unable to save this checklist item."); }
    }, 550);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bidId, canWrite, draft, item.id]);
  async function remove() {
    if (!window.confirm("Remove this checklist item?")) return;
    setState("saving");
    const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/checklist-items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) { setState("error"); setError(body?.error || "Unable to remove this checklist item."); return; }
    onRemoved();
  }
  const update = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));
  return <div className="rounded-xl border border-white/10 bg-black/15 p-4">
    <div className="mb-3 text-sm font-semibold text-neutral-400">Item {displayNumber}</div>
    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]"><Field label="Task"><input value={draft.task} onChange={(event) => update({ task: event.target.value })} disabled={!canWrite} className={inputClass} /></Field><Field label="Owner"><input value={draft.ownerName} onChange={(event) => update({ ownerName: event.target.value })} disabled={!canWrite} placeholder="Unassigned" className={inputClass} /></Field><Field label="Due date"><input type="date" value={draft.dueDate} onChange={(event) => update({ dueDate: event.target.value })} disabled={!canWrite} className={inputClass} /></Field></div>
    <StatusTrack value={draft.status} disabled={!canWrite} onChange={(status) => update({ status })} />
    <Field label="Notes" className="mt-3 block"><textarea rows={2} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} disabled={!canWrite} className={`${inputClass} h-auto py-2`} /></Field>
    {canWrite && <div className="mt-3 flex min-h-6 items-center justify-between gap-3"><button type="button" onClick={() => void remove()} disabled={state === "saving"} className="inline-flex items-center gap-2 text-sm font-semibold text-red-300 disabled:opacity-50"><Trash2 className="h-4 w-4" />Remove</button><span className={`inline-flex items-center gap-1.5 text-xs ${state === "error" ? "text-red-300" : "text-neutral-500"}`}>{state === "saving" && <><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Saving…</>}{state === "saved" && <><Check className="h-3.5 w-3.5 text-emerald-400" />Saved</>}{state === "error" && error}</span></div>}
  </div>;
}

function StatusTrack({ value, disabled, onChange }: { value: ChecklistStatus; disabled: boolean; onChange: (value: ChecklistStatus) => void }) {
  const selectedIndex = STATUSES.findIndex((status) => status.value === value);
  return <fieldset className="mt-5" disabled={disabled}><legend className="mb-3 text-xs uppercase tracking-[0.14em] text-neutral-500">Checklist status</legend><div className="overflow-x-auto pb-1"><div className="relative flex min-w-[560px] items-center justify-between"><div className="absolute left-[10%] right-[10%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" /><div className="absolute left-[10%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#fb5411] transition-[width] duration-300" style={{ width: `${(selectedIndex / (STATUSES.length - 1)) * 80}%` }} />{STATUSES.map((status, index) => { const selected = status.value === value; const reached = index <= selectedIndex; return <button key={status.value} type="button" onClick={() => onChange(status.value)} aria-pressed={selected} className={`relative z-10 min-w-[108px] rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-[#fb5411] bg-[#fb5411] text-white shadow-[0_0_0_4px_rgba(251,84,17,0.14)]" : reached ? "border-[#fb5411]/60 bg-neutral-950 text-[#ff8a5b]" : "border-white/15 bg-neutral-950 text-neutral-500 hover:border-white/30 hover:text-neutral-300"}`}>{status.label}</button>; })}</div></div></fieldset>;
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={`text-xs text-neutral-400 ${className}`}>{label}{children}</label>; }
