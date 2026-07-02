"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

type Period = "all" | "month" | "date" | "range";

export default function ProjectsTableFilter({
  query,
  period,
  month,
  date,
  from,
  to,
  category,
  categories,
  status,
}: {
  query: string;
  period: Period;
  month: string;
  date: string;
  from: string;
  to: string;
  category: string;
  categories: string[];
  status: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasFilters = Boolean(
    query || period !== "all" || category || status
  );

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "Close project filters" : "Open project filters"}
        aria-expanded={mobileOpen}
        aria-controls="project-filters"
        title={mobileOpen ? "Close filters" : "Filter projects"}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition md:hidden ${
          mobileOpen || hasFilters
            ? "border-[#fb5411]/40 bg-[#fb5411]/10 text-[#fb5411]"
            : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        {mobileOpen ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        )}
        {hasFilters && !mobileOpen && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#fb5411]"
            aria-hidden="true"
          />
        )}
      </button>

      <form
        id="project-filters"
        action="/admin/projects"
        method="get"
        className={`items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2 md:grid lg:flex lg:flex-wrap ${
          mobileOpen ? "mt-3 grid" : "hidden"
        }`}
      >
      <div className="min-w-0 sm:col-span-2 lg:min-w-64 lg:flex-1">
        <label
          htmlFor="project-search"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Search projects
        </label>
        <input
          id="project-search"
          name="q"
          type="search"
          defaultValue={query}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Customer or proposal number"
          className="h-10 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-[#fb5411]"
        />
      </div>

      <div className="min-w-0">
        <label
          htmlFor="project-category-filter"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Category
        </label>
        <FilterSelect
          id="project-category-filter"
          name="category"
          defaultValue={category}
        >
          <option value="">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="min-w-0">
        <label
          htmlFor="project-status-filter"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Status
        </label>
        <FilterSelect
          id="project-status-filter"
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          {["lead", "quoted", "pending", "active", "completed", "lost"].map(
            (option) => (
              <option key={option} value={option}>
                {option}
              </option>
            )
          )}
        </FilterSelect>
      </div>

      <div className="min-w-0">
        <label
          htmlFor="project-period"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
        >
          Received
        </label>
        <FilterSelect
          id="project-period"
          name="period"
          value={selectedPeriod}
          onChange={(event) =>
            setSelectedPeriod(event.target.value as Period)
          }
        >
          <option value="all">All time</option>
          <option value="month">By month</option>
          <option value="date">Specific date</option>
          <option value="range">Date range</option>
        </FilterSelect>
      </div>

      {selectedPeriod === "month" && (
        <FilterInput label="Month" name="month" type="month" value={month} />
      )}

      {selectedPeriod === "date" && (
        <FilterInput label="Date" name="date" type="date" value={date} />
      )}

      {selectedPeriod === "range" && (
        <>
          <FilterInput label="From" name="from" type="date" value={from} />
          <FilterInput label="To" name="to" type="date" value={to} />
        </>
      )}

      <button
        type="submit"
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Apply filter
      </button>

      {hasFilters && (
        <Link
          href="/admin/projects"
          className="inline-flex h-10 items-center px-2 text-sm text-neutral-400 transition hover:text-white"
        >
          Clear
        </Link>
      )}
      </form>
    </div>
  );
}

function FilterInput({
  label,
  name,
  type,
  value,
}: {
  label: string;
  name: string;
  type: "date" | "month";
  value: string;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={`project-${name}`}
        className="mb-2 block text-xs font-medium uppercase tracking-wide text-neutral-500"
      >
        {label}
      </label>
      <input
        id={`project-${name}`}
        name={name}
        type={type}
        required
        defaultValue={value}
        className="h-10 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function FilterSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-3 pr-10 text-sm capitalize text-white outline-none focus:border-[#fb5411] lg:max-w-52"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        aria-hidden="true"
      />
    </div>
  );
}
