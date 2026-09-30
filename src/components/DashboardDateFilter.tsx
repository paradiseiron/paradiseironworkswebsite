"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import DashboardRangeDatePicker from "@/components/DashboardRangeDatePicker";

type Period = "all" | "year" | "month" | "range";

export default function DashboardDateFilter({
  period,
  month,
  year,
  availableMonths,
  availableYears,
  from,
  to,
}: {
  period: Period;
  month: string;
  year: string;
  availableMonths: string[];
  availableYears: string[];
  from: string;
  to: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);
  const [selectedFrom, setSelectedFrom] = useState(from);
  const [selectedTo, setSelectedTo] = useState(to);
  const [rangeError, setRangeError] = useState("");

  return (
    <form
      action="/admin"
      method="get"
      onSubmit={(event) => {
        if (selectedPeriod === "range" && (!selectedFrom || !selectedTo)) {
          event.preventDefault();
          setRangeError("Select both a From and To date.");
        }
      }}
      className="mt-6 grid items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 lg:flex lg:flex-wrap"
    >
      <div className="min-w-0 lg:w-48">
        <label
          htmlFor="dashboard-period"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Display data
        </label>
        <div className="relative">
          <select
            id="dashboard-period"
            name="period"
            value={selectedPeriod}
            onChange={(event) =>
              setSelectedPeriod(event.target.value as Period)
            }
            className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-12 text-sm text-white outline-none focus:border-[#fb5411]"
          >
            <option value="all">All time</option>
            <option value="month">By month</option>
            <option value="year">By year</option>
            <option value="range">Date range</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
        </div>
      </div>

      {selectedPeriod === "year" && (
        <div className="min-w-0 lg:w-48">
          <label htmlFor="dashboard-year" className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500">Year</label>
          <div className="relative">
            <select id="dashboard-year" name="year" required defaultValue={year} className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-12 text-sm text-white outline-none focus:border-[#fb5411]">
              {availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          </div>
        </div>
      )}

      {selectedPeriod === "month" && (
        <div className="min-w-0 lg:w-48">
          <label
            htmlFor="dashboard-month"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
          >
            Month
          </label>
          <div className="relative">
            <select
              id="dashboard-month"
              name="month"
              required
              defaultValue={month}
              className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-12 text-sm text-white outline-none focus:border-[#fb5411]"
            >
              {availableMonths.map((availableMonth) => (
                <option key={availableMonth} value={availableMonth}>
                  {formatMonth(availableMonth)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {selectedPeriod === "range" && (
        <>
          <DashboardRangeDatePicker label="From" name="from" value={selectedFrom} onChange={(value) => { setSelectedFrom(value); setRangeError(""); if (selectedTo && value && selectedTo < value) setSelectedTo(""); }} />
          <DashboardRangeDatePicker label="To" name="to" value={selectedTo} min={selectedFrom || undefined} onChange={(value) => { setSelectedTo(value); setRangeError(""); }} />
        </>
      )}

      {rangeError && <p role="alert" className="text-sm text-red-300 sm:col-span-2 lg:w-full">{rangeError}</p>}

      <button
        type="submit"
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        Apply filter
      </button>
    </form>
  );
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
