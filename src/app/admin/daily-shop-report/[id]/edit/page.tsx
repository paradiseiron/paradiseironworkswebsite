import { notFound } from "next/navigation";
import DailyShopReportForm, {
  type ProjectOption,
} from "@/components/DailyShopReportForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditDailyShopReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "operations_foreman");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: report, error: reportError } = await supabase
    .from("daily_shop_reports")
    .select(
      `
        id,
        report_date,
        status,
        general_shop_notes,
        progress_blockers,
        created_by,
        daily_shop_report_employees (
          employee_id,
          no_time_to_report,
          sort_order,
          daily_shop_report_entries (
            project_id,
            manual_project_name,
            time_in,
            time_out,
            sort_order
          )
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (
    reportError ||
    !report ||
    report.created_by !== user.id ||
    report.status !== "submitted"
  ) {
    notFound();
  }

  const existingProjectIds = Array.from(
    new Set(
      (report.daily_shop_report_employees || []).flatMap((employee) =>
        (employee.daily_shop_report_entries || [])
          .map((entry) => entry.project_id)
          .filter((projectId): projectId is string => Boolean(projectId))
      )
    )
  );

  const [
    { data: employees, error: employeeError },
    { data: activeProjects, error: activeProjectError },
    historicalProjectResult,
  ] = await Promise.all([
    supabase
      .from("shop_employees")
      .select("id, name")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("projects")
      .select(
        "id, customer_name, project_category, project_type, proposal_number"
      )
      .eq("status", "active")
      .order("customer_name"),
    existingProjectIds.length
      ? supabase
          .from("projects")
          .select(
            "id, customer_name, project_category, project_type, proposal_number"
          )
          .in("id", existingProjectIds)
      : Promise.resolve({ data: [] as ProjectOption[], error: null }),
  ]);

  if (
    employeeError ||
    activeProjectError ||
    historicalProjectResult.error
  ) {
    throw new Error(
      employeeError?.message ||
        activeProjectError?.message ||
        historicalProjectResult.error?.message ||
        "Unable to load the report."
    );
  }

  const projectsById = new Map<string, ProjectOption>();
  for (const project of [
    ...(activeProjects || []),
    ...(historicalProjectResult.data || []),
  ]) {
    projectsById.set(project.id, project);
  }

  const reportEmployees = [
    ...(report.daily_shop_report_employees || []),
  ].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Edit Daily Shop Report
        </h1>
        <p className="mt-2 text-neutral-400">
          Update the submitted hours, projects, notes, or pictures for this
          report.
        </p>
      </div>

      <DailyShopReportForm
        defaultDate={report.report_date}
        employees={employees || []}
        projects={Array.from(projectsById.values())}
        initialReport={{
          id: report.id,
          generalShopNotes: report.general_shop_notes || "",
          progressBlockers: report.progress_blockers || "",
          employees: reportEmployees.map((employee) => ({
            employeeId: employee.employee_id,
            noTimeToReport: Boolean(employee.no_time_to_report),
            entries: [...(employee.daily_shop_report_entries || [])]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((entry) => ({
                projectId: entry.project_id || "",
                manualProjectName: entry.manual_project_name || "",
                timeIn: entry.time_in.slice(0, 5),
                timeOut: entry.time_out.slice(0, 5),
              })),
          })),
        }}
      />
    </div>
  );
}
