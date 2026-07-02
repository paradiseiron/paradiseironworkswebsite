import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  DollarSign,
} from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardDateFilter from "@/components/DashboardDateFilter";

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
  await requireAuthenticatedUser();
  const filters = await searchParams;
  const period: DashboardPeriod =
    filters.period === "month" || filters.period === "range"
      ? filters.period
      : "all";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = isMonth(filters.month) ? filters.month : currentMonth;
  const from = isDate(filters.from) ? filters.from : "";
  const to = isDate(filters.to) ? filters.to : "";
  const supabase = createAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, customer_name, status, project_category, project_type, lead_source, received_at, has_open_follow_up, proposal_amount, balance_due"
    )
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load dashboard data.");
  }

  const records = (projects || []).filter((project) =>
    isWithinPeriod(project.received_at, period, month, from, to)
  );
  const totalProjects = records.length;
  const openFollowUps = records.filter(
    (project) => project.has_open_follow_up
  ).length;
  const proposalValue = records.reduce(
    (total, project) => total + Number(project.proposal_amount || 0),
    0
  );
  const balanceDue = records.reduce(
    (total, project) => total + Number(project.balance_due || 0),
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
          <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            A live snapshot of your project pipeline and follow-up workload.
          </p>
        </div>

      </div>

      <DashboardDateFilter
        period={period}
        month={month}
        from={from}
        to={to}
      />

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
          label="Open follow-ups"
          value={formatNumber(openFollowUps)}
          detail={
            openFollowUps ? "Require attention" : "All follow-ups are clear"
          }
          icon={<Clock3 className="h-5 w-5" />}
          alert={openFollowUps > 0}
        />
        <MetricCard
          label="Proposal value"
          value={formatCurrency(proposalValue)}
          detail="Across all saved proposals"
          icon={<CircleDollarSign className="h-5 w-5" />}
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
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block px-4 py-4 transition hover:bg-white/[0.025]"
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
                      ? new Date(project.received_at).toLocaleDateString()
                      : "No received date"}
                  </span>
                  {project.has_open_follow_up && (
                    <span className="text-red-300">Needs follow-up</span>
                  )}
                </div>
              </Link>
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
                  <th className="px-6 py-3 font-medium">Follow-up</th>
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
                        ? new Date(project.received_at).toLocaleDateString()
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
                    <td className="px-6 py-4">
                      {project.has_open_follow_up ? (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
                          Needs attention
                        </span>
                      ) : (
                        <span className="text-neutral-600">Clear</span>
                      )}
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

  const received = new Date(receivedAt).getTime();
  if (Number.isNaN(received)) return false;

  if (period === "month") {
    const [year, monthNumber] = month.split("-").map(Number);
    const start = Date.UTC(year, monthNumber - 1, 1);
    const end = Date.UTC(year, monthNumber, 1);
    return received >= start && received < end;
  }

  if (!from || !to) return true;
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T23:59:59.999Z`).getTime();
  return received >= start && received <= end;
}
