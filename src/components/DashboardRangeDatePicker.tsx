"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(Date.UTC(year, month - 1, day)) : null;
}

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function displayDate(value: string) {
  const date = parseDateKey(value);
  return date ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date) : "Select date";
}

export default function DashboardRangeDatePicker({
  label,
  name,
  value,
  onChange,
  min,
}: {
  label: string;
  name: "from" | "to";
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const date = parseDateKey(value) || new Date();
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  });

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const year = view.getUTCFullYear();
  const month = view.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(view);
  const today = dateKey(new Date());
  const days = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);

  function changeMonth(offset: number) {
    setView(new Date(Date.UTC(year, month + offset, 1)));
  }

  return <div ref={container} className="relative min-w-0 lg:w-48">
    <label htmlFor={`dashboard-${name}`} className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</label>
    <input type="hidden" name={name} value={value} />
    <button id={`dashboard-${name}`} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900 px-3 text-left text-sm text-white outline-none transition hover:border-white/20 focus:border-[#fb5411]">
      <span className={value ? "" : "text-neutral-500"}>{displayDate(value)}</span>
      <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
    </button>
    {open && <div role="dialog" aria-label={`${label} date picker`} className={`absolute top-full z-50 ${name === "to" ? "right-0" : "left-0"} mt-2 w-[290px] rounded-2xl border border-white/15 bg-neutral-900 p-4 text-white shadow-2xl`}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold">{monthTitle}</span>
        <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="rounded-lg p-2 text-neutral-300 hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">{weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">{days.map((day, index) => {
        if (!day) return <span key={`empty-${index}`} />;
        const key = dateKey(new Date(Date.UTC(year, month, day)));
        const disabled = Boolean(min && key < min);
        return <button key={key} type="button" disabled={disabled} aria-label={displayDate(key)} aria-pressed={key === value} onClick={() => { onChange(key); setOpen(false); }} className={`h-9 rounded-lg transition ${key === value ? "bg-[#fb5411] font-semibold text-white" : key === today ? "border border-[#fb5411] text-[#fb5411] hover:bg-white/10" : "hover:bg-white/10"} disabled:cursor-not-allowed disabled:opacity-30`}>{day}</button>;
      })}</div>
      <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xs">
        <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-neutral-400 hover:text-white">Clear</button>
        <button type="button" disabled={Boolean(min && today < min)} onClick={() => { onChange(today); setOpen(false); }} className="font-medium text-[#fb5411] disabled:opacity-30">Today</button>
      </div>
    </div>}
  </div>;
}
