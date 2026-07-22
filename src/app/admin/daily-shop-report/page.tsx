import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAssignedRole } from "@/lib/roles";
import {
  formatReportDate,
  formatReportDateTime,
  formatReportHours,
  firstReportRelation,
} from "@/lib/daily-shop-reports";
import SuccessToast from "@/components/SuccessToast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DailyShopReportPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const canEdit = role === "operations_foreman";
  const filters = await searchParams;
  const supabase = createAdminClient();

  const { data: reports, error } = await supabase
    .from("daily_shop_reports")
    .select(
      `
        id,
        report_date,
        status,
        submitted_by,
        submitted_at,
        daily_shop_report_employees (
          total_minutes,
          shop_employees (name),
          daily_shop_report_entries (
            manual_project_name,
            projects (customer_name)
          )
        )
      `
    )
    .eq("status", "submitted")
    .order("report_date", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load daily shop reports.");
  }

  const submitterIds = Array.from(
    new Set(
      (reports || [])
        .map((report) => report.submitted_by)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: submitters } = submitterIds.length
    ? await supabase
        .from("user_roles")
        .select("user_id, display_name, notification_email")
        .in("user_id", submitterIds)
    : { data: [] };
  const submitterNames = new Map(
    (submitters || []).map((submitter) => [
      submitter.user_id,
      submitter.display_name ||
        submitter.notification_email?.split("@")[0] ||
        "User",
    ])
  );

  const rows = (reports || []).map((report) => {
    const employees = report.daily_shop_report_employees || [];
    const employeeNames = employees
      .map(
        (employee) =>
          firstReportRelation(employee.shop_employees)?.name
      )
      .filter((name): name is string => Boolean(name));
    const projects = Array.from(
      new Set(
        employees.flatMap((employee) =>
          (employee.daily_shop_report_entries || [])
            .map(
              (entry) =>
                firstReportRelation(entry.projects)?.customer_name ||
                entry.manual_project_name
            )
            .filter((name): name is string => Boolean(name))
        )
      )
    );
    const totalMinutes = employees.reduce(
      (total, employee) => total + Number(employee.total_minutes || 0),
      0
    );

    return {
      ...report,
      employeeNames,
      projects,
      totalMinutes,
      submittedBy: submitterNames.get(report.submitted_by || "") || "User",
    };
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      {filters.toast === "report-submitted" && (
        <SuccessToast
          message="Daily Shop Report submitted successfully."
          queryParam="toast"
        />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Daily Shop Reports
          </h1>
          <p className="mt-2 text-neutral-400">
            Review submitted employee hours, project activity, notes, and
            pictures.
          </p>
        </div>
        {canEdit && (
          <span className="rounded-full border border-[#fb5411]/25 bg-[#fb5411]/10 px-3 py-1.5 text-xs font-semibold text-[#ff7a45]">
            Operations Foreman
          </span>
        )}
      </div>

      {rows.length ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="divide-y divide-white/10 md:hidden">
            {rows.map((report) => (
              <Link
                key={report.id}
                href={`/admin/daily-shop-report/${report.id}`}
                className="block p-4 transition hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {formatReportDate(report.report_date)}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {report.employeeNames.join(", ") || "No employees"}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-neutral-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <SummaryValue
                    label="Labor hours"
                    value={formatReportHours(report.totalMinutes)}
                  />
                  <SummaryValue
                    label="Projects"
                    value={String(report.projects.length)}
                  />
                  <SummaryValue label="Submitted by" value={report.submittedBy} />
                  <SummaryValue
                    label="Submitted"
                    value={formatReportDateTime(report.submitted_at)}
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Report date</th>
                  <th className="px-5 py-3 font-medium">Employees</th>
                  <th className="px-5 py-3 font-medium">Projects</th>
                  <th className="px-5 py-3 font-medium">Labor hours</th>
                  <th className="px-5 py-3 font-medium">Submitted by</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((report) => (
                  <tr
                    key={report.id}
                    className="relative border-t border-white/10 transition hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      <Link
                        href={`/admin/daily-shop-report/${report.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {formatReportDate(report.report_date)}
                      </Link>
                    </td>
                    <td className="max-w-64 px-5 py-4 text-neutral-300">
                      {report.employeeNames.join(", ") || "—"}
                    </td>
                    <td className="max-w-72 truncate px-5 py-4 text-neutral-300">
                      {report.projects.join(", ") || "—"}
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-200">
                      {formatReportHours(report.totalMinutes)}
                    </td>
                    <td className="px-5 py-4 text-neutral-300">
                      {report.submittedBy}
                    </td>
                    <td className="px-5 py-4 text-neutral-400">
                      {formatReportDateTime(report.submitted_at)}
                    </td>
                    <td className="relative px-5 py-4">
                      <span className="inline-flex rounded-lg p-2 text-neutral-500">
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fb5411]/10 text-[#fb5411]">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No submitted reports yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-400">
            Submitted Daily Shop Reports will appear here for every assigned
            user to review.
          </p>
        </section>
      )}
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-neutral-200">{value}</p>
    </div>
  );
}
