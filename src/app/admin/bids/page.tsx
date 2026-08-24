import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatCalendarDate } from "@/lib/date-time";
import { getUserRole, hasBidWriteAccess } from "@/lib/roles";
import SuccessToast from "@/components/SuccessToast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BidOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
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
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Bid Opportunities
          </h1>
          <p className="mt-2 text-neutral-400">
            Track commercial opportunities from initial review through bid outcome.
          </p>
        </div>
        {hasBidWriteAccess(role) && (
          <Link
            href="/admin/bids/new"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
          >
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            New Bid Opportunity
          </Link>
        )}
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
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
        highlighted
          ? "border-red-400/25 bg-red-400/10 text-red-200"
          : "border-white/10 bg-white/5 text-neutral-300"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
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
