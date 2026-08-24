import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireBidWriteRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updateBidOpportunity(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const id = value(formData, "id");
  const projectName = value(formData, "project_name");
  const bidDueDate = value(formData, "bid_due_date");
  if (!projectName) throw new Error("Project name is required.");
  if (!bidDueDate) throw new Error("Bid due date is required.");

  const { error } = await createAdminClient()
    .from("bid_opportunities")
    .update({
      project_name: projectName,
      general_contractor: optionalValue(formData, "general_contractor"),
      owner_name: optionalValue(formData, "owner_name"),
      architect_name: optionalValue(formData, "architect_name"),
      project_address: optionalValue(formData, "project_address"),
      city: optionalValue(formData, "city"),
      state: optionalValue(formData, "state"),
      zip_code: optionalValue(formData, "zip_code"),
      bid_due_date: bidDueDate,
      bid_due_time: optionalValue(formData, "bid_due_time"),
      assigned_estimator_id: optionalValue(formData, "assigned_estimator_id"),
      estimated_contract_value: optionalNumber(formData, "estimated_contract_value"),
      probability: optionalNumber(formData, "probability"),
      priority: value(formData, "priority") || "normal",
      scope_summary: optionalValue(formData, "scope_summary"),
      exclusion_notes: optionalValue(formData, "exclusion_notes"),
      notes: optionalValue(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`/admin/bids/${id}?toast=opportunity-updated`);
}

export default async function EditBidOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: bid, error }, { data: estimators }] = await Promise.all([
    supabase.from("bid_opportunities").select("*").eq("id", id).single(),
    supabase.from("user_roles").select("user_id, display_name, notification_email").eq("role", "bid_estimator").order("display_name"),
  ]);
  if (error || !bid) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:rounded-3xl sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Edit Bid Opportunity</h1>
        <p className="mt-2 text-neutral-400">Update bid opportunity information.</p>
        <form id="edit-bid-opportunity-form" action={updateBidOpportunity} className="mt-8 space-y-8">
          <input type="hidden" name="id" value={id} />
          <FormSection title="Project Overview">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Project Name" name="project_name" defaultValue={bid.project_name} required />
              <Field label="General Contractor (GC)" name="general_contractor" defaultValue={bid.general_contractor} />
              <Field label="Owner" name="owner_name" defaultValue={bid.owner_name} />
              <Field label="Architect" name="architect_name" defaultValue={bid.architect_name} />
              <Field label="Project Address" name="project_address" defaultValue={bid.project_address} wide />
              <Field label="City" name="city" defaultValue={bid.city} />
              <Field label="State" name="state" defaultValue={bid.state} />
              <Field label="ZIP Code" name="zip_code" defaultValue={bid.zip_code} />
            </div>
          </FormSection>
          <FormSection title="Pre-Bid Information">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Bid Due Date" name="bid_due_date" type="date" defaultValue={bid.bid_due_date} required />
              <Field label="Bid Due Time" name="bid_due_time" type="time" defaultValue={bid.bid_due_time?.slice(0, 5)} />
              <Select label="Assigned Bid Estimator" name="assigned_estimator_id" defaultValue={bid.assigned_estimator_id || ""}>
                <option value="">Unassigned</option>
                {(estimators || []).map((estimator) => <option key={estimator.user_id} value={estimator.user_id}>{estimator.display_name || estimator.notification_email || "Bid Estimator"}</option>)}
              </Select>
              <Select label="Priority" name="priority" defaultValue={bid.priority || "normal"}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
              </Select>
              <Field label="Estimated Contract Value" name="estimated_contract_value" type="number" min="0" step="0.01" defaultValue={bid.estimated_contract_value} />
              <Field label="Probability (%)" name="probability" type="number" min="0" max="100" step="1" defaultValue={bid.probability} />
            </div>
          </FormSection>
          <FormSection title="Scope & Notes">
            <div className="space-y-5">
              <Area label="Scope Summary" name="scope_summary" value={bid.scope_summary} />
              <Area label="Exclusion Information" name="exclusion_notes" value={bid.exclusion_notes} />
              <Area label="General Notes" name="notes" value={bid.notes} />
            </div>
          </FormSection>
        </form>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>{children}</section>;
}
function Field({ label, name, type = "text", defaultValue, required, min, max, step, wide }: { label: string; name: string; type?: string; defaultValue?: string | number | null; required?: boolean; min?: string; max?: string; step?: string; wide?: boolean }) {
  return <label className={wide ? "md:col-span-2" : ""}><span className="mb-2 block text-sm text-neutral-300">{label}{required ? " *" : ""}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} min={min} max={max} step={step} className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-[#fb5411]" /></label>;
}
function Select({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: React.ReactNode }) {
  return <label><span className="mb-2 block text-sm text-neutral-300">{label}</span><div className="relative"><select name={name} defaultValue={defaultValue} className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 pr-12 text-white outline-none focus:border-[#fb5411]">{children}</select><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">⌄</span></div></label>;
}
function Area({ label, name, value: defaultValue }: { label: string; name: string; value?: string | null }) {
  return <label><span className="mb-2 block text-sm text-neutral-300">{label}</span><textarea name={name} rows={4} defaultValue={defaultValue || ""} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]" /></label>;
}
function value(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
function optionalValue(formData: FormData, name: string) { return value(formData, name) || null; }
function optionalNumber(formData: FormData, name: string) { const raw = value(formData, name); if (!raw) return null; const number = Number(raw); if (!Number.isFinite(number)) throw new Error(`${name} must be a valid number.`); return number; }
