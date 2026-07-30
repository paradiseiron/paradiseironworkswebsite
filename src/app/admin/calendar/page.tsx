import CalendarMonthView, {
  type CalendarEventRecord,
  type CalendarSiteVisit,
} from "@/components/CalendarMonthView";
import type {
  EmployeeOption,
  ProjectOption,
} from "@/components/DailyShopReportForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getWashingtonDateKey } from "@/lib/date-time";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const params = await searchParams;
  const currentMonth = getWashingtonDateKey(new Date()).slice(0, 7);
  const month = isMonth(params.month) ? params.month : currentMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const calendarStart = new Date(firstDay);
  calendarStart.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setUTCDate(calendarStart.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    return {
      date: dateKey,
      day: date.getUTCDate(),
      isCurrentMonth: dateKey >= monthStart && dateKey <= monthEnd,
    };
  });

  const supabase = createAdminClient();
  const [
    { data: visitData, error: visitError },
    { data: eventData, error: eventError },
    { data: projectData, error: projectError },
    { data: employeeData, error: employeeError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, customer_name, project_type, site_visit_status, site_visit_scheduled_date, site_visit_window_start, site_visit_window_end, site_visit_location, site_visit_admin_notes, site_visit_scope_observations, site_visit_notes, site_visit_assigned_to"
      )
      .gte("site_visit_scheduled_date", calendarDays[0].date)
      .lte(
        "site_visit_scheduled_date",
        calendarDays[calendarDays.length - 1].date
      )
      .order("site_visit_scheduled_date")
      .order("site_visit_window_start"),
    supabase
      .from("calendar_events")
      .select(
        "id, event_type, event_date, window_start, window_end, project_id, manual_project_name, notes, created_at, updated_at, projects(customer_name, project_category, project_type, proposal_number), calendar_event_employees(employee_id, shop_employees(name))"
      )
      .gte("event_date", calendarDays[0].date)
      .lte("event_date", calendarDays[calendarDays.length - 1].date)
      .order("event_date")
      .order("window_start"),
    supabase
      .from("projects")
      .select(
        "id, customer_name, project_category, project_type, proposal_number"
      )
      .eq("status", "active")
      .order("customer_name"),
    supabase
      .from("shop_employees")
      .select("id, name")
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (visitError || eventError || projectError || employeeError) {
    throw new Error(
      visitError?.message ||
        eventError?.message ||
        projectError?.message ||
        employeeError?.message ||
        "Unable to load the calendar."
    );
  }

  const visits = (visitData || []) as CalendarSiteVisit[];
  const assigneeIds = Array.from(
    new Set(visits.map((visit) => visit.site_visit_assigned_to).filter(Boolean))
  ) as string[];
  const { data: assignees } = assigneeIds.length
    ? await supabase
        .from("user_roles")
        .select("user_id, display_name, notification_email")
        .in("user_id", assigneeIds)
    : { data: [] };
  const assigneeNames = new Map(
    (assignees || []).map((assignee) => [
      assignee.user_id,
      assignee.display_name?.trim() ||
        assignee.notification_email?.split("@")[0] ||
        "Assigned user",
    ])
  );

  return (
    <CalendarMonthView
      month={month}
      currentMonth={currentMonth}
      today={getWashingtonDateKey(new Date())}
      days={calendarDays}
      visits={visits.map((visit) => ({
        ...visit,
        assignee_name: visit.site_visit_assigned_to
          ? assigneeNames.get(visit.site_visit_assigned_to) || null
          : null,
      }))}
      events={(eventData || []) as unknown as CalendarEventRecord[]}
      projects={(projectData || []) as ProjectOption[]}
      employees={(employeeData || []) as EmployeeOption[]}
      canWrite={
        role === "admin" ||
        role === "estimator" ||
        role === "operations_foreman"
      }
    />
  );
}

function isMonth(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}
