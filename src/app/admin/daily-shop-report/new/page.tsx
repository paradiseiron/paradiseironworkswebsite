import DailyShopReportForm from "@/components/DailyShopReportForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWashingtonDateKey } from "@/lib/date-time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewDailyShopReportPage() {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "operations_foreman");
  const supabase = createAdminClient();

  const [{ data: employees, error: employeeError }, { data: projects, error: projectError }] =
    await Promise.all([
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
    ]);

  if (employeeError || projectError) {
    throw new Error(
      employeeError?.message ||
        projectError?.message ||
        "Unable to load the report form."
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Daily Shop Report
        </h1>
        <p className="mt-2 text-neutral-400">
          Record employee project hours and shop progress, then submit the
          completed report.
        </p>
      </div>

      <DailyShopReportForm
        defaultDate={getWashingtonDateKey(new Date())}
        employees={employees || []}
        projects={projects || []}
      />
    </div>
  );
}
