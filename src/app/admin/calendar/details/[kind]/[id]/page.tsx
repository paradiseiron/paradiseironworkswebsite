import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import CalendarMobileEventActions from "@/components/CalendarMobileEventActions";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWashingtonDateKey } from "@/lib/date-time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MEETINGS = {
  "sales-meeting": {
    title: "Sales Meeting",
    schedule: "Every Wednesday",
    time: "8:00 AM",
    url: "https://teams.live.com/meet/9399594154475?p=8PXbub8K0xyRuYg0Zh",
  },
  "all-hands": {
    title: "Weekly All Hands",
    schedule: "Every Friday",
    time: "12:00 PM",
    url: "https://teams.live.com/meet/9383902754652?p=aesqFMD14PYMyyxIiD",
  },
} as const;

export default async function CalendarDetailPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const { kind, id } = await params;
  const supabase = createAdminClient();

  if (kind === "meeting") {
    const meeting = MEETINGS[id as keyof typeof MEETINGS];
    if (!meeting) notFound();
    return (
      <DetailPage title={meeting.title} month={getWashingtonDateKey(new Date()).slice(0, 7)}>
        <Detail label="Schedule" value={meeting.schedule} />
        <Detail label="Time" value={meeting.time} />
        <Detail label="Location" value="Microsoft Teams" />
        <a
          href={meeting.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Join Teams meeting
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </DetailPage>
    );
  }

  if (kind === "visit") {
    const { data: visit } = await supabase
      .from("projects")
      .select(
        "id, customer_name, project_type, site_visit_status, site_visit_scheduled_date, site_visit_window_start, site_visit_window_end, site_visit_location, site_visit_admin_notes, site_visit_scope_observations, site_visit_notes, site_visit_assigned_to"
      )
      .eq("id", id)
      .maybeSingle();
    if (!visit?.site_visit_scheduled_date) notFound();
    const { data: assignee } = visit.site_visit_assigned_to
      ? await supabase
          .from("user_roles")
          .select("display_name, notification_email")
          .eq("user_id", visit.site_visit_assigned_to)
          .maybeSingle()
      : { data: null };
    const month = visit.site_visit_scheduled_date.slice(0, 7);
    return (
      <DetailPage title="Site Visit" month={month}>
        <Detail label="Date" value={formatDate(visit.site_visit_scheduled_date)} />
        <Detail
          label="Time"
          value={
            formatTimeWindow(
              visit.site_visit_window_start,
              visit.site_visit_window_end
            ) || "Not specified"
          }
        />
        <Detail label="Project" value={visit.customer_name || "Unnamed project"} />
        <Detail label="Project type" value={visit.project_type || "Not specified"} />
        <Detail
          label="Status"
          value={(visit.site_visit_status || "scheduled").replaceAll("_", " ")}
        />
        <Detail
          label="Assigned to"
          value={
            assignee?.display_name?.trim() ||
            assignee?.notification_email?.split("@")[0] ||
            "Unassigned"
          }
        />
        <Detail label="Location" value={visit.site_visit_location || "Not specified"} />
        <Detail label="Admin notes" value={visit.site_visit_admin_notes || "None"} />
        <Detail
          label="Scope observations"
          value={visit.site_visit_scope_observations || "None"}
        />
        <Detail label="Visit notes" value={visit.site_visit_notes || "None"} />
        <Link
          href={`/admin/projects/${visit.id}?tab=site-visit`}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white hover:bg-[#e64d0f]"
        >
          Open site visit details
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </DetailPage>
    );
  }

  if (kind === "event") {
    const { data: event } = await supabase
      .from("calendar_events")
      .select(
        "id, event_type, event_date, window_start, window_end, project_id, bid_work_item_id, manual_project_name, notes, projects(customer_name), bid_work_items(description, item_number, bid_opportunities(id, project_name)), calendar_event_employees(shop_employees(name))"
      )
      .eq("id", id)
      .maybeSingle();
    if (!event) notFound();
    const month = event.event_date.slice(0, 7);
    const project = Array.isArray(event.projects)
      ? event.projects[0]
      : event.projects;
    const workItem = Array.isArray(event.bid_work_items)
      ? event.bid_work_items[0]
      : event.bid_work_items;
    const workItemBid = Array.isArray(workItem?.bid_opportunities)
      ? workItem?.bid_opportunities[0]
      : workItem?.bid_opportunities;
    const employees = (event.calendar_event_employees || [])
      .map((assignment) => {
        const employee = Array.isArray(assignment.shop_employees)
          ? assignment.shop_employees[0]
          : assignment.shop_employees;
        return employee?.name;
      })
      .filter(Boolean)
      .join(", ");

    return (
      <DetailPage
        title={`${capitalize(event.event_type)} Event`}
        month={month}
      >
        <Detail label="Type" value={capitalize(event.event_type)} />
        <Detail label="Date" value={formatDate(event.event_date)} />
        <Detail
          label="Time"
          value={
            formatTimeWindow(event.window_start, event.window_end) ||
            "No time window"
          }
        />
        <Detail
          label="Project"
          value={event.manual_project_name || (workItem ? `${workItemBid?.project_name || "Won bid"} · ${workItem.item_number ? `Item ${workItem.item_number}: ` : ""}${workItem.description}` : null) || project?.customer_name || "Unnamed project"}
        />
        <Detail label="Employees" value={employees || "None assigned"} />
        <Detail label="Notes" value={event.notes || "None"} />
        {event.project_id && (
          <Link
            href={`/admin/projects/${event.project_id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a45] hover:text-[#fb5411]"
          >
            Open project
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
        {event.bid_work_item_id && workItemBid?.id && (
          <Link href={`/admin/bids/${workItemBid.id}?tab=schedule-of-work`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a45] hover:text-[#fb5411]">Open bid schedule<ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
        )}
        {(role === "admin" ||
          role === "estimator" ||
          role === "operations_foreman") && (
          <CalendarMobileEventActions eventId={event.id} month={month} />
        )}
      </DetailPage>
    );
  }

  notFound();
}

function DetailPage({
  title,
  month,
  children,
}: {
  title: string;
  month: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/admin/calendar?month=${month}`}
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Calendar
      </Link>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="mt-5">{children}</div>
      </section>
    </div>
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
