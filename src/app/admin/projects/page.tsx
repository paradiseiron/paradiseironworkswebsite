import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import ProjectsTableFilter from "@/components/ProjectsTableFilter";
import {
  formatWashingtonDate,
  getWashingtonDateKey,
} from "@/lib/date-time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectPeriod = "all" | "month" | "date" | "range";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    period?: string;
    month?: string;
    date?: string;
    from?: string;
    to?: string;
    category?: string;
    status?: string;
  }>;
}) {
  await requireAuthenticatedUser();
  const filters = await searchParams;
  const query = filters.q?.trim() || "";
  const period: ProjectPeriod =
    filters.period === "month" ||
    filters.period === "date" ||
    filters.period === "range"
      ? filters.period
      : "all";
  const currentMonth = getWashingtonDateKey(new Date()).slice(0, 7);
  const month = isMonth(filters.month) ? filters.month : currentMonth;
  const date = isDate(filters.date) ? filters.date : "";
  const from = isDate(filters.from) ? filters.from : "";
  const to = isDate(filters.to) ? filters.to : "";
  const category = filters.category?.trim() || "";
  const status = filters.status?.trim().toLowerCase() || "";

  const supabase = createAdminClient();

  const { data: allProjects, error } = await supabase
    .from("projects")
    .select("*")
    .order("received_at", { ascending: false });

  if (error) {
  console.error("Error loading projects:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(error.message || "Failed to load projects");
}
  const categories = Array.from(
    new Set(
      (allProjects || [])
        .map((project) => project.project_category?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));

  const normalizedQuery = query.toLowerCase();
  const projects = (allProjects || []).filter((project) => {
    const matchesQuery =
      !normalizedQuery ||
      project.customer_name?.toLowerCase().includes(normalizedQuery) ||
      project.proposal_number?.toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      !category || project.project_category === category;
    const matchesStatus =
      !status || (project.status || "lead").toLowerCase() === status;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesStatus &&
      isWithinPeriod(project.received_at, period, month, date, from, to)
    );
  });

  const newWebsiteLeadCount =
    allProjects?.filter(
      (project) =>
        project.lead_source === "Website" &&
        !project.website_lead_reviewed_at
    ).length || 0;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Projects</h1>

          <p className="mt-2 text-neutral-400">
            Track jobs from lead through proposal, production, completion, and
            invoice.
          </p>
        </div>
      </div>

      {newWebsiteLeadCount > 0 && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-4 text-sky-100"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          <p>
            <span className="font-semibold">{newWebsiteLeadCount} new website</span>{" "}
            {newWebsiteLeadCount === 1 ? "lead is" : "leads are"} waiting to be
            reviewed.
          </p>
        </div>
      )}

      <ProjectsTableFilter
        query={query}
        period={period}
        month={month}
        date={date}
        from={from}
        to={to}
        category={category}
        categories={categories}
        status={status}
      />

      <div className="grid gap-3 md:hidden">
        {projects && projects.length > 0 ? (
          projects.map((project) => {
            const isNewWebsiteLead =
              project.lead_source === "Website" &&
              !project.website_lead_reviewed_at;

            return (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className={`rounded-2xl border p-4 transition active:scale-[0.99] ${
                  isNewWebsiteLead
                    ? "border-sky-400/25 bg-sky-400/[0.06]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {project.customer_name}
                    </p>
                    <p className="mt-1 truncate text-sm text-neutral-400">
                      {project.project_type || project.project_category || "Project"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs capitalize ${getStatusStyles(
                      project.status
                    )}`}
                  >
                    {project.status || "lead"}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <MobileProjectDetail
                    label="Received"
                    value={
                      project.received_at
                        ? formatWashingtonDate(project.received_at)
                        : "—"
                    }
                  />
                  <MobileProjectDetail
                    label="Proposal"
                    value={project.proposal_number || "—"}
                  />
                  <MobileProjectDetail
                    label="Proposal amount"
                    value={
                      project.proposal_amount
                        ? `$${Number(project.proposal_amount).toLocaleString()}`
                        : "—"
                    }
                  />
                  <MobileProjectDetail
                    label="Balance due"
                    value={
                      project.balance_due
                        ? `$${Number(project.balance_due).toLocaleString()}`
                        : "—"
                    }
                  />
                </dl>

                {(isNewWebsiteLead || project.has_open_follow_up) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isNewWebsiteLead && (
                      <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-300">
                        New website lead
                      </span>
                    )}
                    {project.has_open_follow_up && (
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
                        Needs follow-up
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })
        ) : (
          <p className="rounded-2xl border border-white/10 p-5 text-sm text-neutral-400">
            {query || period !== "all" || category || status
              ? "No projects match the selected filters."
              : "No projects yet."}
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full min-w-[1260px] text-left text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Project Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Follow-Up</th>
              <th className="whitespace-nowrap px-4 py-3">Proposal #</th>
              <th className="px-4 py-3">Proposal Amount</th>
              <th className="px-4 py-3">Balance Due</th>
            </tr>
          </thead>

          <tbody>
            {projects && projects.length > 0 ? (
              projects.map((project) => {
                const isNewWebsiteLead =
                  project.lead_source === "Website" &&
                  !project.website_lead_reviewed_at;

                return (
                <tr
                  key={project.id}
                  className={`rounded-xl border-t border-white/10 transition hover:bg-[#fb5411]/10 hover:shadow-[inset_0_0_0_1px_#fb5411] ${
                    isNewWebsiteLead ? "bg-sky-400/[0.06]" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-neutral-300">
                    {project.received_at
                      ? formatWashingtonDate(project.received_at)
                      : "—"}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="hover:text-[#fb5411]"
                    >
                      {project.customer_name}
                    </Link>
                    {isNewWebsiteLead && (
                      <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        New
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 capitalize text-neutral-300">
                    {project.project_category || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.project_type || "—"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${getStatusStyles(
                        project.status
                      )}`}
                    >
                      {project.status || "lead"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {project.has_open_follow_up ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span>Needs Follow-Up</span>
                      </div>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                    {project.proposal_number || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.proposal_amount
                      ? `$${Number(project.proposal_amount).toLocaleString()}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.balance_due
                      ? `$${Number(project.balance_due).toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-neutral-400" colSpan={9}>
                  {query || period !== "all" || category || status
                    ? "No projects match the selected filters."
                    : "No projects yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileProjectDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 truncate text-neutral-200">{value}</dd>
    </div>
  );
}

function getStatusStyles(status?: string | null) {
  switch (status) {
    case "lead":
      return "border-white/10 bg-white/5 text-white";
    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    case "quoted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "completed":
      return "border-green-500/20 bg-green-500/10 text-green-300";
    case "lost":
      return "border-neutral-500/20 bg-neutral-500/10 text-neutral-400";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
}

function isMonth(value?: string): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function isDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function isWithinPeriod(
  receivedAt: string | null,
  period: ProjectPeriod,
  month: string,
  date: string,
  from: string,
  to: string
) {
  if (period === "all") return true;
  if (!receivedAt) return false;

  const receivedDate = new Date(receivedAt);
  if (Number.isNaN(receivedDate.getTime())) return false;
  const receivedDateKey = getWashingtonDateKey(receivedDate);

  if (period === "month") {
    return receivedDateKey.startsWith(month);
  }

  if (period === "date") {
    if (!date) return true;
    return receivedDateKey === date;
  }

  if (!from || !to) return true;
  return receivedDateKey >= from && receivedDateKey <= to;
}
