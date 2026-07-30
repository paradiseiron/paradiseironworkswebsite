"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  type EmployeeOption,
  ProjectCombobox,
  type ProjectOption,
  TimeSelect,
} from "@/components/DailyShopReportForm";
import SuccessToast from "@/components/SuccessToast";

export type CalendarSiteVisit = {
  id: string;
  customer_name: string | null;
  project_type: string | null;
  site_visit_status: string | null;
  site_visit_scheduled_date: string;
  site_visit_window_start: string | null;
  site_visit_window_end: string | null;
  site_visit_location: string | null;
  site_visit_admin_notes: string | null;
  site_visit_scope_observations: string | null;
  site_visit_notes: string | null;
  site_visit_assigned_to: string | null;
  assignee_name?: string | null;
};

export type CalendarEventRecord = {
  id: string;
  event_type: "fabrication" | "installation";
  event_date: string;
  window_start: string | null;
  window_end: string | null;
  project_id: string | null;
  manual_project_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects: {
    customer_name: string | null;
    project_category: string | null;
    project_type: string | null;
    proposal_number: string | null;
  } | null;
  calendar_event_employees: {
    employee_id: string;
    shop_employees: { name: string | null } | null;
  }[];
};

type Meeting = {
  kind: "meeting";
  id: "sales-meeting" | "all-hands";
  title: string;
  time: string;
  dayName: string;
  url: string;
};

type SelectedItem =
  | { kind: "visit"; visit: CalendarSiteVisit }
  | { kind: "event"; event: CalendarEventRecord }
  | Meeting;

type EventDraft = {
  id: string;
  eventType: "fabrication" | "installation";
  eventDate: string;
  windowStart: string;
  windowEnd: string;
  projectId: string;
  manualProjectName: string;
  notes: string;
  employeeIds: string[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SALES_MEETING: Meeting = {
  kind: "meeting",
  id: "sales-meeting",
  title: "Sales Meeting",
  time: "8:00 AM",
  dayName: "Wednesday",
  url: "https://teams.live.com/meet/9399594154475?p=8PXbub8K0xyRuYg0Zh",
};
const ALL_HANDS: Meeting = {
  kind: "meeting",
  id: "all-hands",
  title: "Weekly All Hands",
  time: "12:00 PM",
  dayName: "Friday",
  url: "https://teams.live.com/meet/9383902754652?p=aesqFMD14PYMyyxIiD",
};

export default function CalendarMonthView({
  month,
  currentMonth,
  today,
  days,
  visits,
  events,
  projects,
  employees,
  canWrite,
  initialEditEventId,
}: {
  month: string;
  currentMonth: string;
  today: string;
  days: { date: string; day: number; isCurrentMonth: boolean }[];
  visits: CalendarSiteVisit[];
  events: CalendarEventRecord[];
  projects: ProjectOption[];
  employees: EmployeeOption[];
  canWrite: boolean;
  initialEditEventId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(() => {
    const event = events.find((item) => item.id === initialEditEventId);
    return event ? draftFromEvent(event) : null;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [eventAddedToast, setEventAddedToast] = useState(0);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const visitsByDate = groupByDate(visits, "site_visit_scheduled_date");
  const eventsByDate = groupByDate(events, "event_date");

  function startCreating(date = today) {
    setSelected(null);
    setError("");
    setDraft({
      id: "",
      eventType: "fabrication",
      eventDate: date,
      windowStart: "",
      windowEnd: "",
      projectId: "",
      manualProjectName: "",
      notes: "",
      employeeIds: [],
    });
  }

  function startEditing(event: CalendarEventRecord) {
    setSelected(null);
    setError("");
    setDraft(draftFromEvent(event));
  }

  async function saveEvent(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!draft) return;
    const isNewEvent = !draft.id;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        draft.id
          ? `/api/admin/calendar-events/${encodeURIComponent(draft.id)}`
          : "/api/admin/calendar-events",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Unable to save the calendar event.");
      }
      setDraft(null);
      if (isNewEvent) setEventAddedToast(Date.now());
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the calendar event."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent(event: CalendarEventRecord) {
    if (!window.confirm("Delete this calendar event permanently?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/calendar-events/${encodeURIComponent(event.id)}`,
        { method: "DELETE" }
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Unable to delete the event.");
      }
      setSelected(null);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the event."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1800px]">
      {eventAddedToast > 0 && (
        <SuccessToast
          key={eventAddedToast}
          message="Calendar event added successfully."
        />
      )}
      <div
        className={`grid items-start gap-6 ${
          selected || draft
            ? "lg:h-[calc(100dvh-7rem)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:overflow-hidden"
            : ""
        }`}
      >
        <div
          className={`min-w-0 ${
            selected || draft
              ? "lg:h-full lg:overflow-y-auto lg:pr-1"
              : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Calendar</h1>
          <p className="mt-2 text-neutral-400">
            Site visits, project work, and recurring meetings.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/calendar?month=${currentMonth}`}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Today
          </Link>
          {canWrite && (
            <button
              type="button"
              onClick={() => startCreating()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add event
            </button>
          )}
        </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <MonthLink month={shiftMonth(year, monthNumber, -1)} previous />
          <h2 className="text-lg font-semibold sm:text-xl">{monthTitle}</h2>
          <MonthLink month={shiftMonth(year, monthNumber, 1)} />
        </header>
        <div className="overflow-x-hidden sm:overflow-x-auto">
          <div className="w-full sm:min-w-[900px]">
            <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="px-0.5 py-2 text-center text-[9px] font-semibold uppercase tracking-wide text-neutral-500 sm:px-3 sm:text-xs"
                >
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(({ date, day, isCurrentMonth }, dayIndex) => {
                const dayVisits = visitsByDate.get(date) || [];
                const dayEvents = eventsByDate.get(date) || [];
                const isWednesday = dayIndex % 7 === 3;
                const isFriday = dayIndex % 7 === 5;
                return (
                  <div
                    key={date}
                    className={`min-h-20 min-w-0 overflow-hidden border-b border-r border-white/10 p-0.5 sm:min-h-36 sm:p-2 ${
                      isCurrentMonth ? "" : "bg-black/20"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-0.5 sm:mb-2 sm:gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] sm:h-7 sm:w-7 sm:text-sm ${
                          date === today
                            ? "bg-[#fb5411] font-semibold text-white"
                            : isCurrentMonth
                              ? "text-neutral-400"
                              : "text-neutral-700"
                        }`}
                      >
                        {day}
                      </span>
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => startCreating(date)}
                          aria-label={`Add event on ${date}`}
                          className="hidden rounded p-1 text-neutral-600 transition hover:bg-white/5 hover:text-white sm:block"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {isWednesday && (
                        <CalendarItem
                          title={SALES_MEETING.title}
                          subtitle={SALES_MEETING.time}
                          color="violet"
                          mobileHref="/admin/calendar/details/meeting/sales-meeting"
                          onClick={() => setSelected(SALES_MEETING)}
                        />
                      )}
                      {isFriday && (
                        <CalendarItem
                          title={ALL_HANDS.title}
                          subtitle={ALL_HANDS.time}
                          color="violet"
                          mobileHref="/admin/calendar/details/meeting/all-hands"
                          onClick={() => setSelected(ALL_HANDS)}
                        />
                      )}
                      {dayVisits.map((visit) => (
                        <CalendarItem
                          key={`visit-${visit.id}`}
                          title={visit.customer_name || "Site visit"}
                          subtitle={formatTimeWindow(
                            visit.site_visit_window_start,
                            visit.site_visit_window_end
                          )}
                          color="orange"
                          mobileHref={`/admin/calendar/details/visit/${visit.id}`}
                          onClick={() => setSelected({ kind: "visit", visit })}
                        />
                      ))}
                      {dayEvents.map((event) => (
                        <CalendarItem
                          key={event.id}
                          title={`${capitalize(event.event_type)} · ${eventProjectName(event)}`}
                          subtitle={formatTimeWindow(
                            event.window_start,
                            event.window_end
                          )}
                          color={
                            event.event_type === "fabrication"
                              ? "emerald"
                              : "blue"
                          }
                          mobileHref={`/admin/calendar/details/event/${event.id}`}
                          onClick={() => setSelected({ kind: "event", event })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
          </section>
        </div>

        {selected && (
          <DetailsDrawer
            item={selected}
            canWrite={canWrite}
            busy={busy}
            onClose={() => {
              setSelected(null);
              setError("");
            }}
            onEdit={startEditing}
            onDelete={deleteEvent}
            error={error}
          />
        )}
        {draft && (
          <EventFormDrawer
            draft={draft}
            projects={projects}
            employees={employees}
            busy={busy}
            error={error}
            setDraft={setDraft}
            onClose={() => {
              setDraft(null);
              setError("");
            }}
            onSubmit={saveEvent}
          />
        )}
      </div>
    </div>
  );
}

function CalendarItem({
  title,
  subtitle,
  color,
  onClick,
  mobileHref,
}: {
  title: string;
  subtitle?: string;
  color: "violet" | "orange" | "emerald" | "blue";
  onClick: () => void;
  mobileHref: string;
}) {
  const colors = {
    violet: "border-violet-400/25 bg-violet-400/10 hover:bg-violet-400/15",
    orange: "border-orange-400/25 bg-orange-400/10 hover:bg-orange-400/15",
    emerald: "border-emerald-400/25 bg-emerald-400/10 hover:bg-emerald-400/15",
    blue: "border-blue-400/25 bg-blue-400/10 hover:bg-blue-400/15",
  };
  const content = (
    <>
      <span className="block truncate text-[8px] font-semibold leading-tight text-white sm:text-xs">
        {title}
      </span>
      {subtitle && (
        <span className="mt-0.5 hidden truncate text-[10px] text-neutral-300 sm:block">
          {subtitle}
        </span>
      )}
    </>
  );
  return (
    <>
      <Link
        href={mobileHref}
        className={`block w-full cursor-pointer overflow-hidden rounded border p-0.5 text-left transition sm:hidden ${colors[color]}`}
      >
        {content}
      </Link>
      <button
      type="button"
      onClick={onClick}
      className={`hidden w-full cursor-pointer rounded-lg border p-2 text-left transition sm:block ${colors[color]}`}
    >
      {content}
    </button>
    </>
  );
}

function DetailsDrawer({
  item,
  canWrite,
  busy,
  onClose,
  onEdit,
  onDelete,
  error,
}: {
  item: SelectedItem;
  canWrite: boolean;
  busy: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEventRecord) => void;
  onDelete: (event: CalendarEventRecord) => Promise<void>;
  error: string;
}) {
  return (
    <Drawer title={itemTitle(item)} onClose={onClose}>
      {item.kind === "meeting" && (
        <>
          <Detail label="Schedule" value={`Every ${item.dayName}`} />
          <Detail label="Time" value={item.time} />
          <Detail label="Location" value="Microsoft Teams" />
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Join Teams meeting
            <ExternalLink className="h-4 w-4" />
          </a>
        </>
      )}
      {item.kind === "visit" && (
        <>
          <Detail label="Date" value={formatDate(item.visit.site_visit_scheduled_date)} />
          <Detail
            label="Time"
            value={
              formatTimeWindow(
                item.visit.site_visit_window_start,
                item.visit.site_visit_window_end
              ) || "Not specified"
            }
          />
          <Detail label="Project" value={item.visit.customer_name || "Unnamed project"} />
          <Detail label="Project type" value={item.visit.project_type || "Not specified"} />
          <Detail label="Status" value={(item.visit.site_visit_status || "scheduled").replaceAll("_", " ")} />
          <Detail label="Assigned to" value={item.visit.assignee_name || "Unassigned"} />
          <Detail label="Location" value={item.visit.site_visit_location || "Not specified"} />
          <Detail label="Admin notes" value={item.visit.site_visit_admin_notes || "None"} />
          <Detail label="Scope observations" value={item.visit.site_visit_scope_observations || "None"} />
          <Detail label="Visit notes" value={item.visit.site_visit_notes || "None"} />
          <Link
            href={`/admin/projects/${item.visit.id}?tab=site-visit`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64d0f]"
          >
            Open site visit details
            <ExternalLink className="h-4 w-4" />
          </Link>
        </>
      )}
      {item.kind === "event" && (
        <>
          <Detail label="Type" value={capitalize(item.event.event_type)} />
          <Detail label="Date" value={formatDate(item.event.event_date)} />
          <Detail
            label="Time"
            value={
              formatTimeWindow(item.event.window_start, item.event.window_end) ||
              "No time window"
            }
          />
          <Detail label="Project" value={eventProjectName(item.event)} />
          <Detail label="Notes" value={item.event.notes || "None"} />
          <Detail
            label="Employees"
            value={
              item.event.calendar_event_employees
                .map((assignment) => assignment.shop_employees?.name)
                .filter(Boolean)
                .join(", ") || "None assigned"
            }
          />
          {item.event.project_id && (
            <Link
              href={`/admin/projects/${item.event.project_id}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a45] hover:text-[#fb5411]"
            >
              Open project
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {canWrite && (
            <div className="mt-8 flex gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => onEdit(item.event)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => void onDelete(item.event)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </Drawer>
  );
}

function EventFormDrawer({
  draft,
  projects,
  employees,
  busy,
  error,
  setDraft,
  onClose,
  onSubmit,
}: {
  draft: EventDraft;
  projects: ProjectOption[];
  employees: EmployeeOption[];
  busy: boolean;
  error: string;
  setDraft: React.Dispatch<React.SetStateAction<EventDraft | null>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  const update = (changes: Partial<EventDraft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));
  return (
    <Drawer title={draft.id ? "Edit event" : "Add event"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block text-sm text-neutral-300">
          <span className="mb-2 block">Event type *</span>
          <span className="relative block">
            <select
              required
              value={draft.eventType}
              onChange={(event) =>
                update({
                  eventType: event.target.value as
                    | "fabrication"
                    | "installation",
                })
              }
              className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 py-0 pl-4 pr-12 text-white outline-none focus:border-[#fb5411]"
            >
              <option value="fabrication">Fabrication</option>
              <option value="installation">Installation</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
          </span>
        </label>
        <ProjectCombobox
          projects={projects}
          value={draft.projectId}
          manualValue={draft.manualProjectName}
          required
          onChange={(projectId, manualProjectName) =>
            update({ projectId, manualProjectName })
          }
        />
        <EmployeeMultiSelect
          employees={employees}
          selectedIds={draft.employeeIds}
          onChange={(employeeIds) => update({ employeeIds })}
        />
        <label className="block text-sm text-neutral-300">
          <span className="mb-2 block">Date *</span>
          <input
            type="date"
            required
            value={draft.eventDate}
            onChange={(event) => update({ eventDate: event.target.value })}
            className="h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]"
          />
        </label>
        <div>
          <p className="mb-2 text-sm text-neutral-300">
            Time window <span className="text-neutral-500">(Optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect
              label="Start time"
              value={draft.windowStart}
              onChange={(windowStart) => update({ windowStart })}
              allowEmpty
            />
            <TimeSelect
              label="End time"
              value={draft.windowEnd}
              onChange={(windowEnd) => update({ windowEnd })}
              allowEmpty
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            If used, both start and end times are required.
          </p>
        </div>
        <label className="block text-sm text-neutral-300">
          <span className="mb-2 block">Notes</span>
          <textarea
            rows={5}
            maxLength={2000}
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#fb5411] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64d0f] disabled:opacity-50"
        >
          {busy ? "Saving…" : draft.id ? "Save changes" : "Add event"}
        </button>
      </form>
    </Drawer>
  );
}

function EmployeeMultiSelect({
  employees,
  selectedIds,
  onChange,
}: {
  employees: EmployeeOption[];
  selectedIds: string[];
  onChange: (employeeIds: string[]) => void;
}) {
  const allSelected =
    employees.length > 0 &&
    employees.every((employee) => selectedIds.includes(employee.id));
  const selectedNames = employees
    .filter((employee) => selectedIds.includes(employee.id))
    .map((employee) => employee.name);

  function toggleEmployee(employeeId: string) {
    onChange(
      selectedIds.includes(employeeId)
        ? selectedIds.filter((id) => id !== employeeId)
        : [...selectedIds, employeeId]
    );
  }

  return (
    <div className="text-sm text-neutral-300">
      <span className="mb-2 block">
        Employees *
      </span>
      <details className="group relative">
        <summary className="flex h-11 list-none items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 py-0 pl-4 pr-12 text-left text-white outline-none focus:border-[#fb5411]">
          <span className="min-w-0 flex-1 truncate">
            {selectedNames.length
              ? selectedNames.join(", ")
              : "Select employees"}
          </span>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-neutral-500 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-2xl">
          <label className="flex items-center gap-3 rounded-lg border-b border-white/10 px-3 py-2.5 font-medium text-[#ff7a45] hover:bg-white/5">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                onChange(allSelected ? [] : employees.map((employee) => employee.id))
              }
              className="h-4 w-4 accent-[#fb5411]"
            />
            Select all
          </label>
          <div className="mt-1 max-h-56 overflow-y-auto">
            {employees.map((employee) => (
              <label
                key={employee.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(employee.id)}
                  onChange={() => toggleEmployee(employee.id)}
                  className="h-4 w-4 accent-[#fb5411]"
                />
                <span className="truncate text-white">{employee.name}</span>
              </label>
            ))}
            {!employees.length && (
              <p className="px-3 py-3 text-neutral-500">
                No active employees are available.
              </p>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={title}
      className="sticky top-24 max-h-[calc(100dvh-7rem)] w-full overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-xl sm:p-6 lg:top-0 lg:h-full lg:max-h-none"
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>
      {children}
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/10 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm capitalize text-neutral-200">
        {value}
      </p>
    </div>
  );
}

function MonthLink({
  month,
  previous = false,
}: {
  month: string;
  previous?: boolean;
}) {
  const Icon = previous ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={`/admin/calendar?month=${month}`}
      aria-label={previous ? "Previous month" : "Next month"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-neutral-300 transition hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </Link>
  );
}

function groupByDate<T, K extends keyof T>(items: T[], key: K) {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const date = String(item[key]);
    grouped.set(date, [...(grouped.get(date) || []), item]);
  });
  return grouped;
}

function itemTitle(item: SelectedItem) {
  if (item.kind === "meeting") return item.title;
  if (item.kind === "visit") return "Site Visit";
  return `${capitalize(item.event.event_type)} Event`;
}

function eventProjectName(event: CalendarEventRecord) {
  if (event.manual_project_name) return event.manual_project_name;
  return event.projects?.customer_name || "Unnamed project";
}

function shiftMonth(year: number, month: number, offset: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(
    shifted.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function shortTime(value?: string | null) {
  return value?.match(/^\d{2}:\d{2}/)?.[0] || "";
}

function draftFromEvent(event: CalendarEventRecord): EventDraft {
  return {
    id: event.id,
    eventType: event.event_type,
    eventDate: event.event_date,
    windowStart: shortTime(event.window_start),
    windowEnd: shortTime(event.window_end),
    projectId: event.project_id || "",
    manualProjectName: event.manual_project_name || "",
    notes: event.notes || "",
    employeeIds: event.calendar_event_employees.map(
      (assignment) => assignment.employee_id
    ),
  };
}

function formatTimeWindow(start?: string | null, end?: string | null) {
  if (!start && !end) return "";
  if (start && end) return `${formatTime(start)}–${formatTime(end)}`;
  return formatTime(start || end || "");
}

function formatTime(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}/${year}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
