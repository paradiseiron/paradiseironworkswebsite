"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronDown,
  Mic,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { formatReportHours } from "@/lib/daily-shop-reports";

type EmployeeOption = { id: string; name: string };
type ProjectOption = {
  id: string;
  customer_name: string | null;
  project_category: string | null;
  project_type: string | null;
  proposal_number: string | null;
};
type WorkEntry = {
  key: string;
  projectId: string;
  manualProjectName: string;
  timeIn: string;
  timeOut: string;
};
type EmployeeCard = {
  key: string;
  employeeId: string;
  noTimeToReport: boolean;
  entries: WorkEntry[];
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 ? 30 : 0;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const suffix = hours >= 12 ? "PM" : "AM";
  return {
    value,
    label: `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`,
  };
});

export default function DailyShopReportForm({
  defaultDate,
  employees,
  projects,
}: {
  defaultDate: string;
  employees: EmployeeOption[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState<EmployeeCard[]>(() =>
    employees.map((employee, index) => ({
      key: `initial-employee-${index}`,
      employeeId: employee.id,
      noTimeToReport: false,
      entries: [
        {
          key: `initial-project-${index}`,
          projectId: "",
          manualProjectName: "",
          timeIn: "07:00",
          timeOut: "15:30",
        },
      ],
    }))
  );
  const [generalNotes, setGeneralNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateCard(cardKey: string, update: (card: EmployeeCard) => EmployeeCard) {
    setCards((current) =>
      current.map((card) => (card.key === cardKey ? update(card) : card))
    );
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const form = event.currentTarget;
      const payload = {
        reportDate: String(new FormData(form).get("report_date") || ""),
        generalShopNotes: generalNotes,
        progressBlockers: blockers,
        employees: cards.map((card, employeeIndex) => ({
          employeeId: card.employeeId,
          noTimeToReport: card.noTimeToReport,
          sortOrder: employeeIndex,
          entries: card.entries.map((entry, entryIndex) => ({
            projectId: entry.projectId || null,
            manualProjectName: entry.manualProjectName,
            timeIn: entry.timeIn,
            timeOut: entry.timeOut,
            sortOrder: entryIndex,
          })),
        })),
      };
      const body = new FormData();
      body.set("payload", JSON.stringify(payload));
      const photoInput = form.elements.namedItem("photos") as HTMLInputElement | null;
      for (const file of Array.from(photoInput?.files || [])) {
        body.append("photos", file);
      }

      const response = await fetch("/api/admin/daily-shop-reports", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Unable to submit the report.");
      }

      router.push("/admin/daily-shop-report?toast=report-submitted");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the report."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      id="daily-shop-report-form"
      onSubmit={submitReport}
      className="mt-8 space-y-6"
    >
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <label className="block max-w-xs text-sm text-neutral-300">
          <span className="mb-2 block">Report date</span>
          <input
            type="date"
            name="report_date"
            required
            defaultValue={defaultDate}
            className="h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]"
          />
        </label>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {cards.map((card) => {
          const employeeName =
            employees.find((employee) => employee.id === card.employeeId)
              ?.name || "Employee";
          const totalMinutes = card.noTimeToReport
            ? 0
            : card.entries.reduce(
                (total, entry) => total + entryMinutes(entry),
                0
              );

          return (
            <section
              key={card.key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{employeeName}</h2>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={card.noTimeToReport}
                    onChange={(event) =>
                      updateCard(card.key, (current) => ({
                        ...current,
                        noTimeToReport: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/20 accent-[#fb5411]"
                  />
                  No Time to Report
                </label>
              </div>

              <fieldset
                disabled={card.noTimeToReport}
                className={`mt-5 space-y-3 transition ${
                  card.noTimeToReport ? "opacity-40" : ""
                }`}
              >
                {card.entries.map((entry, entryIndex) => (
                  <div
                    key={entry.key}
                    className="rounded-xl border border-white/10 bg-black/10 p-3"
                  >
                    <div className="grid gap-3">
                      <ProjectCombobox
                        projects={projects}
                        value={entry.projectId}
                        manualValue={entry.manualProjectName}
                        onChange={(projectId, manualProjectName) =>
                          updateCard(card.key, (current) => ({
                            ...current,
                            entries: current.entries.map((item) =>
                              item.key === entry.key
                                ? { ...item, projectId, manualProjectName }
                                : item
                            ),
                          }))
                        }
                      />
                      <TimeSelect
                        label="Start time"
                        value={entry.timeIn}
                        onChange={(value) =>
                          updateEntryTime(card.key, entry.key, "timeIn", value)
                        }
                      />
                      <TimeSelect
                        label="End time"
                        value={entry.timeOut}
                        onChange={(value) =>
                          updateEntryTime(card.key, entry.key, "timeOut", value)
                        }
                      />
                      <button
                        type="button"
                        disabled={card.entries.length === 1}
                        onClick={() =>
                          updateCard(card.key, (current) => ({
                            ...current,
                            entries: current.entries.filter(
                              (item) => item.key !== entry.key
                            ),
                          }))
                        }
                        aria-label={`Remove project ${entryIndex + 1}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-3 text-neutral-400 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </fieldset>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={card.noTimeToReport}
                  onClick={() =>
                    updateCard(card.key, (current) => ({
                      ...current,
                      entries: [...current.entries, newWorkEntry()],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add project
                </button>
                <p className="text-sm text-neutral-400">
                  Employee total:{" "}
                  <span className="font-semibold text-white">
                    {formatReportHours(totalMinutes)}
                  </span>
                </p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <DictationField
          label="General Shop Notes"
          value={generalNotes}
          onChange={setGeneralNotes}
        />
        <DictationField
          label="Progress Blockers"
          value={blockers}
          onChange={setBlockers}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 px-5 py-8 text-sm font-semibold text-neutral-300 transition hover:border-[#fb5411]/40 hover:text-white">
          <Camera className="h-5 w-5 text-[#fb5411]" aria-hidden="true" />
          Add report pictures
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="sr-only"
          />
        </label>
      </section>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#fb5411] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#e64d0f] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Submitting report…" : "Submit Daily Shop Report"}
      </button>
    </form>
  );

  function updateEntryTime(
    cardKey: string,
    entryKey: string,
    field: "timeIn" | "timeOut",
    value: string
  ) {
    updateCard(cardKey, (current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.key === entryKey ? { ...entry, [field]: value } : entry
      ),
    }));
  }
}

function ProjectCombobox({
  projects,
  value,
  manualValue,
  onChange,
}: {
  projects: ProjectOption[];
  value: string;
  manualValue: string;
  onChange: (projectId: string, manualProjectName: string) => void;
}) {
  const selected = projects.find((project) => project.id === value);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const manual = !value && manualValue !== "";
  const filtered = projects.filter((project) =>
    projectSearchText(project).includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (manual) {
    return (
      <label className="text-sm text-neutral-300">
        <span className="mb-2 flex items-center justify-between gap-3">
          Manual project name
          <button
            type="button"
            onClick={() => onChange("", "")}
            className="text-xs text-[#fb5411]"
          >
            Select project
          </button>
        </span>
        <input
          value={manualValue}
          onChange={(event) => onChange("", event.target.value)}
          required
          className="h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]"
        />
      </label>
    );
  }

  return (
    <div ref={comboboxRef} className="relative text-sm text-neutral-300">
      <span className="mb-2 block">Project</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 px-4 text-left text-white outline-none focus:border-[#fb5411]"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? projectLabel(selected) : "Select or search projects"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-2xl">
          <div className="relative border-b border-white/10 p-2">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search active projects"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-10 pr-3 text-white outline-none focus:border-[#fb5411]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  onChange(project.id, "");
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10"
              >
                <span className="block truncate text-sm text-white">
                  {projectLabel(project)}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="px-3 py-3 text-sm text-neutral-500">
                No active projects match.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                onChange("", " ");
                setOpen(false);
              }}
              className="mt-1 block w-full rounded-lg border-t border-white/10 px-3 py-3 text-left text-sm font-medium text-[#ff7a45] hover:bg-white/5"
            >
              Enter project manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-neutral-300">
      <span className="mb-2 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-white outline-none focus:border-[#fb5411]"
      >
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DictationField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  function dictate() {
    const Recognition = (
      window as typeof window & {
        webkitSpeechRecognition?: new () => {
          continuous: boolean;
          interimResults: boolean;
          onresult: (event: {
            results: ArrayLike<ArrayLike<{ transcript: string }>>;
          }) => void;
          start: () => void;
        };
      }
    ).webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      onChange(`${value}${value ? " " : ""}${transcript}`);
    };
    recognition.start();
  }

  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300 sm:p-6">
      <span className="mb-2 flex items-center justify-between gap-3">
        {label}
        <button
          type="button"
          onClick={dictate}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#fb5411]"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Dictate
        </button>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

function newWorkEntry(): WorkEntry {
  return {
    key: crypto.randomUUID(),
    projectId: "",
    manualProjectName: "",
    timeIn: "07:00",
    timeOut: "15:30",
  };
}

function entryMinutes(entry: WorkEntry) {
  const [inHours, inMinutes] = entry.timeIn.split(":").map(Number);
  const [outHours, outMinutes] = entry.timeOut.split(":").map(Number);
  return Math.max(outHours * 60 + outMinutes - (inHours * 60 + inMinutes), 0);
}

function projectLabel(project: ProjectOption) {
  return [
    project.customer_name || "Unnamed customer",
    project.project_category,
    project.project_type,
    project.proposal_number,
  ]
    .filter(Boolean)
    .join(" | ");
}

function projectSearchText(project: ProjectOption) {
  return projectLabel(project).toLowerCase();
}
