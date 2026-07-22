"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

type Period = "all" | "month" | "range";

export default function DashboardDateFilter({
  period,
  month,
  availableMonths,
  from,
  to,
}: {
  period: Period;
  month: string;
  availableMonths: string[];
  from: string;
  to: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);

  return (
    <form
      action="/admin"
      method="get"
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
            className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-10 text-sm text-white outline-none focus:border-[#fb5411]"
          >
            <option value="all">All time</option>
            <option value="month">By month</option>
            <option value="range">Date range</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
        </div>
      </div>

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
              className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-10 text-sm text-white outline-none focus:border-[#fb5411]"
            >
              {availableMonths.map((availableMonth) => (
                <option key={availableMonth} value={availableMonth}>
                  {formatMonth(availableMonth)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {selectedPeriod === "range" && (
        <>
          <div className="min-w-0">
            <label
              htmlFor="dashboard-from"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
            >
              From
            </label>
            <input
              id="dashboard-from"
              name="from"
              type="date"
              required
              defaultValue={from}
              className="h-10 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="dashboard-to"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
            >
              To
            </label>
            <input
              id="dashboard-to"
              name="to"
              type="date"
              required
              min={from || undefined}
              defaultValue={to}
              className="h-10 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
            />
          </div>
        </>
      )}

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
