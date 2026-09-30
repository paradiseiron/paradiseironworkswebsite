"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type CostProjectOption = { value: string; label: string; group: "Residential / Non-bid" | "Commercial Bid" };

export default function CostProjectCombobox({ options, defaultValue = "", defaultGeneral = false, disabled = false }: { options: CostProjectOption[]; defaultValue?: string; defaultGeneral?: boolean; disabled?: boolean }) {
  const selected = options.find(option => option.value === defaultValue);
  const [general, setGeneral] = useState(defaultGeneral);
  const [query, setQuery] = useState(selected?.label || "");
  const [value, setValue] = useState(selected?.value || "");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter(option => !needle || option.label.toLowerCase().includes(needle)).slice(0, 20);
  }, [options, query]);
  function choose(option: CostProjectOption) { setValue(option.value); setQuery(option.label); setOpen(false); }
  function toggleGeneral(checked: boolean) { setGeneral(checked); if (checked) { setValue(""); setQuery(""); setOpen(false); } }
  return <div>
    <input type="hidden" name="project_source" value={general ? "" : value} />
    <input type="hidden" name="is_general_expense" value={general ? "true" : "false"} />
    <div className="relative mt-2">
      <input value={query} disabled={disabled || general} required={!general} placeholder="Type a customer, project, or proposal number" autoComplete="off" onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setValue(""); setOpen(true); }} onBlur={() => window.setTimeout(() => setOpen(false), 150)} className="h-12 w-full rounded-xl border border-white/10 bg-neutral-900 pl-4 pr-11 text-sm text-white outline-none focus:border-[#fb5411]/60 disabled:cursor-not-allowed disabled:opacity-50" />
      <ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-neutral-500" />
      {open && !general && query.trim() && <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-neutral-950 p-1 shadow-2xl">
        {matches.length ? matches.map(option => <button type="button" key={option.value} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.07]"><span className="min-w-0"><span className="block truncate text-sm text-white">{option.label}</span><span className="mt-0.5 block text-xs text-neutral-500">{option.group}</span></span>{value === option.value && <Check className="size-4 shrink-0 text-[#fb5411]" />}</button>) : <p className="px-3 py-4 text-sm text-neutral-500">No matching active projects.</p>}
      </div>}
    </div>
    <label className="mt-3 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-neutral-300"><input type="checkbox" checked={general} disabled={disabled} onChange={event => toggleGeneral(event.target.checked)} className="size-4 accent-[#fb5411]" /><span>General expense</span></label>
    <p className="mt-1.5 text-xs text-neutral-500">Use for company expenses that cannot be assigned to a specific project.</p>
  </div>;
}
