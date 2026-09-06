import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CircleDollarSign,
  DollarSign,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardDateFilter from "@/components/DashboardDateFilter";
import {
  formatWashingtonDate,
  getWashingtonDateKey,
} from "@/lib/date-time";
import { getUserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_ORDER = [
  "lead",
  "quoted",
  "pending",
  "active",
  "completed",
  "lost",
];

const STATUS_GRAPH_FILLS: Record<string, string> = {
  lead: "admin-lead-graph-fill border-white/10 bg-white",
  quoted: "border-amber-500/20 bg-amber-500",
  pending: "border-yellow-500/20 bg-yellow-500",
  active: "border-emerald-500/20 bg-emerald-500",
  completed: "border-green-500/20 bg-green-500",
  lost: "border-neutral-500/20 bg-neutral-500",
};

const STATUS_GRAPH_TRACKS: Record<string, string> = {
  lead: "admin-lead-graph-track border-white/10",
  quoted: "border-amber-500/20",
  pending: "border-yellow-500/20",
  active: "border-emerald-500/20",
  completed: "border-green-500/20",
  lost: "border-neutral-500/20",
};

type DashboardPeriod = "all" | "month" | "range";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  const filters = await searchParams;
  const period: DashboardPeriod =
    filters.period === "all" || filters.period === "range"
      ? filters.period
      : "month";
  const currentMonth = getWashingtonDateKey(new Date()).slice(0, 7);
  const month = isMonth(filters.month) ? filters.month : currentMonth;
  const from = isDate(filters.from) ? filters.from : "";
  const to = isDate(filters.to) ? filters.to : "";
  const supabase = createAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, customer_name, status, project_category, project_type, lead_source, received_at, proposal_amount, initial_payment_received_amount, website_lead_reviewed_at, site_visit_status, site_visit_assigned_to"
    )
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load dashboard data.");
  }

  const records = (projects || []).filter((project) =>
    isWithinPeriod(project.received_at, period, month, from, to)
  );
  const newLeadCount = (projects || []).filter(
    (project) =>
      project.lead_source === "Website" && !project.website_lead_reviewed_at
  ).length;
  const assignedSiteVisitCount = (projects || []).filter(
    (project) =>
      project.site_visit_status === "ready" &&
      project.site_visit_assigned_to === user.id
  ).length;
  const availableMonths = Array.from(
    new Set([
      currentMonth,
      ...(projects || [])
        .map((project) => {
          if (!project.received_at) return "";
          const receivedDate = new Date(project.received_at);
          return Number.isNaN(receivedDate.getTime())
            ? ""
            : getWashingtonDateKey(receivedDate).slice(0, 7);
        })
        .filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));
  const totalProjects = records.length;
  const proposalValue = records.reduce(
    (total, project) => total + Number(project.proposal_amount || 0),
    0
  );
  const balanceDue = records
    .filter(
      (project) => (project.status || "lead").toLowerCase() === "active"
    )
    .reduce(
      (total, project) =>
        total +
        Number(project.proposal_amount || 0) -
        Number(project.initial_payment_received_amount || 0),
      0
    );
  const pipelineRevenue = records
    .filter((project) =>
      ["active", "completed"].includes(
        (project.status || "lead").toLowerCase()
      )
    )
    .reduce(
      (total, project) => total + Number(project.proposal_amount || 0),
      0
    );

  const statusCounts = STATUS_ORDER.map((status) => ({
    label: status,
    value: records.filter(
      (project) => (project.status || "lead").toLowerCase() === status
    ).length,
  }));

  const sourceMap = records.reduce<Record<string, number>>((totals, project) => {
    const source = project.lead_source?.trim() || "Unspecified";
    totals[source] = (totals[source] || 0) + 1;
    return totals;
  }, {});
  const leadSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const largestSource = Math.max(...leadSources.map(([, count]) => count), 1);

  const activePipeline = records.filter((project) =>
    ["lead", "quoted", "pending", "active"].includes(
      (project.status || "lead").toLowerCase()
    )
  ).length;

  return (
    <div className="mx-auto max-w-[1500px]">
      <div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fb5411]">
            Residential &amp; Non-Bid Commercial
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            A live snapshot of your project pipeline and revenue.
          </p>
        </div>

      </div>

      <DashboardDateFilter
        period={period}
        month={month}
        availableMonths={availableMonths}
        from={from}
        to={to}
      />

      {role === "admin" && (
        <NotificationSummary
          href="/admin/projects"
          label="New lead notifications"
          count={newLeadCount}
          detail={
            newLeadCount
              ? `${newLeadCount === 1 ? "lead is" : "leads are"} waiting to be reviewed`
              : "All new website leads have been reviewed"
          }
          icon={<BellRing className="h-5 w-5" aria-hidden="true" />}
          tone="sky"
        />
      )}

      {(role === "estimator" || role === "operations_foreman") && (
        <NotificationSummary
          href="/admin/projects"
          label="Site visit notifications"
          count={assignedSiteVisitCount}
          detail={
            assignedSiteVisitCount
              ? `${assignedSiteVisitCount === 1 ? "visit is" : "visits are"} ready for you`
              : "No site visits are currently waiting"
          }
          icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
          tone="orange"
        />
      )}

      <section
        aria-label="Key metrics"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Total projects"
          value={formatNumber(totalProjects)}
          detail={`${activePipeline} in the active pipeline`}
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />
        <MetricCard
          label="Proposal value"
          value={formatCurrency(proposalValue)}
          detail="Across all saved proposals"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <MetricCard
          label="Pipeline revenue"
          value={formatCurrency(pipelineRevenue)}
          detail="Active and completed jobs"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Balance due"
          value={formatCurrency(balanceDue)}
          detail="Outstanding project balance"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-3">
          <div>
            <h2 className="text-lg font-semibold">Project pipeline</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Current projects grouped by status
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {statusCounts.map((status) => {
              const percentage = totalProjects
                ? (status.value / totalProjects) * 100
                : 0;

              return (
                <div key={status.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="capitalize text-neutral-300">
                      {status.label}
                    </span>
                    <span className="font-medium text-white">
                      {status.value}
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        {Math.round(percentage)}%
                      </span>
                    </span>
                  </div>
                  <div
                    className={`h-3 overflow-hidden rounded-full border ${
                      STATUS_GRAPH_TRACKS[status.label]
                    }`}
                  >
                    <div
                      className={`h-full rounded-full border-r ${
                        STATUS_GRAPH_FILLS[status.label]
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">Lead sources</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Where project opportunities originate
          </p>

          <div className="mt-7 space-y-5">
            {leadSources.length ? (
              leadSources.map(([source, count]) => (
                <div key={source}>
                  <div className="mb-2 flex justify-between gap-4 text-sm">
                    <span className="truncate text-neutral-300">{source}</span>
                    <span className="font-medium text-white">{count}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-[#fb5411]/20">
                    <div
                      className="h-full rounded-full border-r border-[#fb5411]/20 bg-[#fb5411]"
                      style={{ width: `${(count / largestSource) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>No lead-source data yet.</EmptyState>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-semibold">Recent projects</h2>
            <p className="mt-1 text-sm text-neutral-400">
              The latest additions to your pipeline
            </p>
          </div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#fb5411] hover:text-[#ff6a2b]"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {records.length ? (
          <>
          <div className="divide-y divide-white/10 md:hidden">
            {records.slice(0, 6).map((project) => (
              <a
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block touch-manipulation px-4 py-4 transition hover:bg-white/[0.025]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.customer_name}</p>
                    <p className="mt-1 truncate text-sm text-neutral-400">
                      {project.project_type || project.project_category || "Project"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs capitalize text-neutral-200">
                    {project.status || "lead"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {project.received_at
                      ? formatWashingtonDate(project.received_at)
                      : "No received date"}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Received</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 6).map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-white/10 transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-medium text-white hover:text-[#fb5411]"
                      >
                        {project.customer_name || "Unnamed project"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {project.project_type ||
                        capitalize(project.project_category) ||
                        "—"}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {project.received_at
                        ? formatWashingtonDate(project.received_at)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs capitalize ${getStatusStyles(
                          project.status
                        )}`}
                      >
                        {project.status || "lead"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState>No projects yet. Add one to populate the dashboard.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationSummary({
  href,
  label,
  count,
  detail,
  icon,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  detail: string;
  icon: React.ReactNode;
  tone: "sky" | "orange";
}) {
  const styles =
    tone === "sky"
      ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
      : "border-[#fb5411]/25 bg-[#fb5411]/10 text-orange-100";
  const iconStyles =
    tone === "sky"
      ? "bg-sky-400/15 text-sky-300"
      : "bg-[#fb5411]/15 text-[#ff7a45]";

  return (
    <Link
      href={href}
      className={`mt-4 flex items-center gap-4 rounded-2xl border px-5 py-4 transition hover:brightness-110 ${styles}`}
    >
      <span className={`rounded-xl p-2.5 ${iconStyles}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-sm opacity-75">{detail}</p>
      </div>
      <span className="text-3xl font-semibold tabular-nums">{count}</span>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
    </Link>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  alert = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-neutral-400">{label}</p>
        <span
          className={`rounded-xl p-2 ${
            alert
              ? "bg-red-500/10 text-red-300"
              : "bg-[#fb5411]/10 text-[#fb5411]"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-2 text-xs ${alert ? "text-red-300" : "text-neutral-500"}`}>
        {detail}
      </p>
    </article>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function capitalize(value?: string | null) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  period: DashboardPeriod,
  month: string,
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

  if (!from || !to) return true;
  return receivedDateKey >= from && receivedDateKey <= to;
}
