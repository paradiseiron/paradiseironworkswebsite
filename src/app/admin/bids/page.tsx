import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  MapPin,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatCalendarDate } from "@/lib/date-time";
import SuccessToast from "@/components/SuccessToast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BID_STATUS_ORDER = ["opportunity", "reviewing", "estimating", "submitted", "won", "lost", "cancelled"];
const BID_STATUS_FILLS: Record<string, string> = {
  opportunity: "border-white/10 bg-white", reviewing: "border-yellow-500/20 bg-yellow-500",
  estimating: "border-amber-500/20 bg-amber-500", submitted: "border-emerald-500/20 bg-emerald-500",
  won: "border-green-500/20 bg-green-500", lost: "border-neutral-500/20 bg-neutral-500",
  cancelled: "border-neutral-500/20 bg-neutral-500",
};
const BID_STATUS_TRACKS: Record<string, string> = {
  opportunity: "border-white/10", reviewing: "border-yellow-500/20", estimating: "border-amber-500/20",
  submitted: "border-emerald-500/20", won: "border-green-500/20", lost: "border-neutral-500/20",
  cancelled: "border-neutral-500/20",
};

export default async function BidOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  await requireAuthenticatedUser();
  const filters = await searchParams;
  const supabase = createAdminClient();
  const { data: opportunities, error } = await supabase
    .from("bid_opportunities")
    .select(
      "id, project_name, general_contractor, project_address, city, state, bid_due_date, bid_due_time, status, estimated_contract_value, probability, priority, assigned_estimator_id"
    )
    .order("bid_due_date", { ascending: true });

  if (error) throw new Error(error.message);

  const estimatorIds = Array.from(
    new Set(
      (opportunities || [])
        .map((opportunity) => opportunity.assigned_estimator_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: estimators } = estimatorIds.length
    ? await supabase
        .from("user_roles")
        .select("user_id, display_name, notification_email")
        .in("user_id", estimatorIds)
    : { data: [] };
  const estimatorNames = new Map(
    (estimators || []).map((estimator) => [
      estimator.user_id,
      estimator.display_name || estimator.notification_email || "Assigned",
    ])
  );
  const bids = opportunities || [];
  const activeStatuses = new Set(["opportunity", "reviewing", "estimating", "submitted"]);
  const activeBids = bids.filter((bid) => activeStatuses.has(bid.status));
  const deadlineBids = bids.filter((bid) =>
    ["opportunity", "reviewing", "estimating"].includes(bid.status)
  );
  const submittedBids = bids.filter((bid) => bid.status === "submitted");
  const wonBids = bids.filter((bid) => bid.status === "won");
  const decidedBids = bids.filter((bid) => bid.status === "won" || bid.status === "lost");
  const totalValue = (rows: typeof bids) => rows.reduce(
    (sum, bid) => sum + Number(bid.estimated_contract_value || 0),
    0
  );
  const winRate = decidedBids.length ? Math.round((wonBids.length / decidedBids.length) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingDate = new Date();
  upcomingDate.setUTCDate(upcomingDate.getUTCDate() + 14);
  const cutoff = upcomingDate.toISOString().slice(0, 10);
  const upcomingBids = deadlineBids.filter((bid) => bid.bid_due_date >= today && bid.bid_due_date <= cutoff);
  const overdueBids = deadlineBids.filter((bid) => bid.bid_due_date < today);

  return (
    <div>
      {filters.toast === "opportunity-created" && (
        <SuccessToast
          message="Bid opportunity successfully created."
          queryParam="toast"
        />
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fb5411]">
            Commercial Bids
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Bid Dashboard</h1>
          <p className="mt-2 text-neutral-400">
            Track commercial opportunities from initial review through bid outcome.
          </p>
        </div>
      </div>

      {(upcomingBids.length > 0 || overdueBids.length > 0) && (
        <Link href="#bid-opportunities" className={`mt-4 flex items-center gap-4 rounded-2xl border px-5 py-4 transition hover:brightness-110 ${overdueBids.length ? "border-red-400/25 bg-red-400/10 text-red-100" : "border-[#fb5411]/25 bg-[#fb5411]/10 text-orange-100"}`}>
          <span className={`rounded-xl p-2.5 ${overdueBids.length ? "bg-red-400/15 text-red-300" : "bg-[#fb5411]/15 text-[#ff7a45]"}`}><CalendarClock className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Bid deadline notifications</p><p className="mt-0.5 text-sm opacity-75">{overdueBids.length ? `${overdueBids.length} overdue · ${upcomingBids.length} due in 14 days` : `${upcomingBids.length} due in the next 14 days`}</p></div>
          <span className="text-3xl font-semibold tabular-nums">{overdueBids.length + upcomingBids.length}</span><ArrowRight className="h-4 w-4 opacity-70" />
        </Link>
      )}

      <section aria-label="Key bid metrics" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total bids" value={String(bids.length)} detail={`${activeBids.length} in the active pipeline`} icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <MetricCard label="Pipeline value" value={currency(totalValue(activeBids))} detail="Open and submitted opportunities" icon={<CircleDollarSign className="h-5 w-5" />} />
        <MetricCard label="Submitted value" value={currency(totalValue(submittedBids))} detail={`${submittedBids.length} awaiting a decision`} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Won value" value={currency(totalValue(wonBids))} detail={`${winRate}% win rate across decided bids`} icon={<Trophy className="h-5 w-5" />} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-3">
          <h2 className="text-lg font-semibold">Bid pipeline</h2><p className="mt-1 text-sm text-neutral-400">Current bids grouped by status</p>
          <div className="mt-7 space-y-5">{BID_STATUS_ORDER.map((status) => { const count=bids.filter((bid)=>bid.status===status).length; const percentage=bids.length?(count/bids.length)*100:0; return <div key={status}><div className="mb-2 flex items-center justify-between text-sm"><span className="capitalize text-neutral-300">{status}</span><span className="font-medium text-white">{count}<span className="ml-2 text-xs font-normal text-neutral-500">{Math.round(percentage)}%</span></span></div><div className={`h-3 overflow-hidden rounded-full border ${BID_STATUS_TRACKS[status]}`}><div className={`h-full rounded-full border-r ${BID_STATUS_FILLS[status]}`} style={{width:`${percentage}%`}} /></div></div>;})}</div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">Bid outcomes</h2><p className="mt-1 text-sm text-neutral-400">Results across decided submissions</p>
          <div className="mt-7"><p className="text-4xl font-semibold tracking-tight">{winRate}%</p><p className="mt-2 text-sm text-neutral-500">Overall win rate</p></div>
          <div className="mt-8 space-y-5">{[["Won",wonBids.length,"bg-green-500 border-green-500/20"],["Lost",decidedBids.length-wonBids.length,"bg-neutral-500 border-neutral-500/20"]] .map(([label,count,fill])=><div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span className="text-neutral-300">{label}</span><span className="font-medium">{count}</span></div><div className="h-3 overflow-hidden rounded-full border border-white/10"><div className={`h-full rounded-full border-r ${fill}`} style={{width:`${decidedBids.length?(Number(count)/decidedBids.length)*100:0}%`}} /></div></div>)}</div>
        </section>
      </div>

      <div id="bid-opportunities" className="mb-4 mt-8 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Bid Opportunities</h2>
        <span className="text-sm text-neutral-500">{bids.length} total</span>
      </div>

      <div className="grid gap-4">
        {opportunities?.length ? (
          opportunities.map((opportunity) => (
            <Link
              key={opportunity.id}
              href={`/admin/bids/${opportunity.id}`}
              className="block cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">
                    {opportunity.project_name}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    {opportunity.general_contractor || "General contractor not entered"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge value={opportunity.priority || "normal"} priority />
                  <Badge value={opportunity.status || "opportunity"} />
                </div>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <BidDetail
                  icon={<CalendarClock className="h-4 w-4" />}
                  label="Bid due"
                  value={`${formatCalendarDate(opportunity.bid_due_date)}${
                    opportunity.bid_due_time
                      ? ` at ${formatTime(opportunity.bid_due_time)}`
                      : ""
                  }`}
                />
                <BidDetail
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={
                    [opportunity.project_address, opportunity.city, opportunity.state]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <BidDetail
                  label="Estimated value"
                  value={
                    opportunity.estimated_contract_value
                      ? currency(Number(opportunity.estimated_contract_value))
                      : "—"
                  }
                />
                <BidDetail
                  label="Estimator / Probability"
                  value={`${
                    estimatorNames.get(opportunity.assigned_estimator_id) ||
                    "Unassigned"
                  } · ${
                    opportunity.probability === null
                      ? "No probability"
                      : `${opportunity.probability}%`
                  }`}
                />
              </dl>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-neutral-500" />
            <h2 className="mt-4 font-semibold text-white">No bid opportunities yet</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Create the first opportunity to begin the commercial bid pipeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ value, priority = false }: { value: string; priority?: boolean }) {
  const highlighted = priority && (value === "high" || value === "urgent");
  const styles = priority
    ? highlighted
      ? "border-red-400/25 bg-red-400/10 text-red-200"
      : "border-white/10 bg-white/5 text-neutral-300"
    : getBidStatusStyles(value);
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4"><p className="text-sm text-neutral-400">{label}</p><span className="rounded-xl bg-[#fb5411]/10 p-2 text-[#fb5411]">{icon}</span></div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-neutral-500">{detail}</p>
    </article>
  );
}

function getBidStatusStyles(status: string) {
  switch (status) {
    case "opportunity":
      return "border-white/10 bg-white/5 text-white";
    case "reviewing":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    case "estimating":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "submitted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "won":
      return "border-green-500/20 bg-green-500/10 text-green-300";
    case "lost":
    case "cancelled":
      return "border-neutral-500/20 bg-neutral-500/10 text-neutral-400";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
}

function BidDetail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-neutral-200">{value}</dd>
    </div>
  );
}

function formatTime(value: string) {
  const [hourValue, minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
