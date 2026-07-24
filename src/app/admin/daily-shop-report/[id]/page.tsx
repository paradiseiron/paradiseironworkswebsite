import { notFound } from "next/navigation";
import { Clock3, ImageIcon } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAssignedRole } from "@/lib/roles";
import {
  formatReportDate,
  formatReportDateTime,
  formatReportHours,
  firstReportRelation,
} from "@/lib/daily-shop-reports";
import { createSignedImageUrls } from "@/lib/signed-images";
import DailyShopReportImageGallery from "@/components/DailyShopReportImageGallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DailyShopReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("daily_shop_reports")
    .select(
      `
        id,
        report_date,
        status,
        general_shop_notes,
        progress_blockers,
        created_by,
        submitted_by,
        submitted_at,
        daily_shop_report_employees (
          id,
          total_minutes,
          no_time_to_report,
          sort_order,
          shop_employees (name),
          daily_shop_report_entries (
            id,
            manual_project_name,
            time_in,
            time_out,
            minutes_worked,
            sort_order,
            projects (
              customer_name,
              project_category,
              project_type,
              proposal_number
            )
          )
        ),
        daily_shop_report_images (
          id,
          storage_path,
          file_name,
          created_at
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !report) notFound();

  const mayReadDraft =
    role === "operations_foreman" && report.created_by === user.id;
  if (report.status !== "submitted" && !mayReadDraft) notFound();

  const { data: submitter } = report.submitted_by
    ? await supabase
        .from("user_roles")
        .select("display_name, notification_email")
        .eq("user_id", report.submitted_by)
        .maybeSingle()
    : { data: null };
  const submittedBy =
    submitter?.display_name ||
    submitter?.notification_email?.split("@")[0] ||
    "—";

  const imageRecords = report.daily_shop_report_images || [];
  const imagePaths = imageRecords.map((image) => image.storage_path);
  const signedImages = await createSignedImageUrls(
    supabase,
    "daily-shop-report-images",
    imagePaths
  );
  const images = imageRecords.map((image, index) => ({
    id: image.id,
    fileName: image.file_name,
    url: signedImages[index]?.url || "",
    thumbnailUrl: signedImages[index]?.thumbnailUrl || "",
  }));
  const canRemoveImages =
    role === "operations_foreman" && report.created_by === user.id;

  const employees = [...(report.daily_shop_report_employees || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const reportMinutes = employees.reduce(
    (total, employee) => total + Number(employee.total_minutes || 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {formatReportDate(report.report_date)}
          </h1>
          <p className="mt-2 text-neutral-400">
            Submitted by {submittedBy} · {formatReportDateTime(report.submitted_at)}
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-300">
          {report.status}
        </span>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Employees" value={String(employees.length)} />
        <Metric label="Total labor" value={formatReportHours(reportMinutes)} />
        <Metric
          label="Pictures"
          value={String(images.length)}
        />
      </section>

      <div className="mt-6 space-y-5">
        {employees.map((employee) => {
          const entries = [...(employee.daily_shop_report_entries || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );

          return (
            <section
              key={employee.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold">
                  {firstReportRelation(employee.shop_employees)?.name ||
                    "Employee"}
                </h2>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#ff7a45]">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {formatReportHours(employee.total_minutes)}
                </span>
              </div>

              <div className="divide-y divide-white/10">
                {employee.no_time_to_report && (
                  <p className="px-4 py-5 text-sm text-neutral-400 sm:px-6">
                    No time was reported for this employee.
                  </p>
                )}
                {entries.map((entry) => {
                  const project = firstReportRelation(entry.projects);
                  const projectName =
                    project?.customer_name ||
                    entry.manual_project_name ||
                    "Manual project";
                  const projectDetail = project
                    ? [
                        project.project_category,
                        project.project_type,
                        project.proposal_number,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Manually entered project";

                  return (
                    <div
                      key={entry.id}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-100">
                          {projectName}
                        </p>
                        <p className="mt-1 truncate text-sm text-neutral-500">
                          {projectDetail}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-300">
                        {formatTime(entry.time_in)}–{formatTime(entry.time_out)}
                      </p>
                      <p className="text-sm font-medium text-neutral-200 sm:min-w-24 sm:text-right">
                        {formatReportHours(entry.minutes_worked)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <TextSection
          title="General Shop Notes"
          value={report.general_shop_notes}
        />
        <TextSection
          title="Progress Blockers"
          value={report.progress_blockers}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5 text-[#fb5411]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Pictures</h2>
        </div>
        {images.length ? (
          <DailyShopReportImageGallery
            reportId={report.id}
            images={images}
            canRemove={canRemoveImages}
          />
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            No pictures were submitted with this report.
          </p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function TextSection({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
        {value || "—"}
      </p>
    </section>
  );
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
