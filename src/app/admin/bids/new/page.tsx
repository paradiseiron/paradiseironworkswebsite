import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireBidWriteRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createBidOpportunity(formData: FormData) {
  "use server";

  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const projectName = textValue(formData, "project_name");
  const bidDueDate = textValue(formData, "bid_due_date");

  if (!projectName) throw new Error("Project name is required.");
  if (!bidDueDate) throw new Error("Bid due date is required.");

  const estimatedValue = optionalNumber(formData, "estimated_contract_value");
  const probability = optionalNumber(formData, "probability");
  if (probability !== null && (probability < 0 || probability > 100)) {
    throw new Error("Probability must be between 0 and 100.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("bid_opportunities").insert({
    project_name: projectName,
    general_contractor: optionalText(formData, "general_contractor"),
    owner_name: optionalText(formData, "owner_name"),
    architect_name: optionalText(formData, "architect_name"),
    project_address: optionalText(formData, "project_address"),
    city: optionalText(formData, "city"),
    state: optionalText(formData, "state"),
    zip_code: optionalText(formData, "zip_code"),
    bid_due_date: bidDueDate,
    bid_due_time: optionalText(formData, "bid_due_time"),
    status: textValue(formData, "status") || "opportunity",
    assigned_estimator_id:
      optionalText(formData, "assigned_estimator_id") || null,
    estimated_contract_value: estimatedValue,
    probability,
    priority: textValue(formData, "priority") || "normal",
    scope_summary: optionalText(formData, "scope_summary"),
    exclusion_notes: optionalText(formData, "exclusion_notes"),
    notes: optionalText(formData, "notes"),
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/bids?toast=opportunity-created");
}

export default async function NewBidOpportunityPage() {
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const supabase = createAdminClient();
  const { data: estimators, error } = await supabase
    .from("user_roles")
    .select("user_id, display_name, notification_email")
    .eq("role", "bid_estimator")
    .order("display_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fb5411]">
          Commercial Bids
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          New Bid Opportunity
        </h1>
        <p className="mt-2 text-neutral-400">
          Record the initial project overview and pre-bid information.
        </p>
      </div>

      <form id="new-bid-opportunity-form" action={createBidOpportunity} className="space-y-5">
        <FormSection title="Project Overview">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Project Name" name="project_name" required />
            <Field label="General Contractor (GC)" name="general_contractor" />
            <Field label="Owner" name="owner_name" />
            <Field label="Architect" name="architect_name" />
            <Field label="Project Address" name="project_address" wide />
            <Field label="City" name="city" />
            <Field label="State" name="state" defaultValue="VA" />
            <Field label="ZIP Code" name="zip_code" />
          </div>
        </FormSection>

        <FormSection title="Pre-Bid Information">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Bid Due Date" name="bid_due_date" type="date" required />
            <Field label="Bid Due Time" name="bid_due_time" type="time" />
            <SelectField label="Bid Status" name="status" defaultValue="opportunity">
              <option value="opportunity">Opportunity</option>
              <option value="reviewing">Reviewing</option>
              <option value="estimating">Estimating</option>
            </SelectField>
            <SelectField label="Assigned Bid Estimator" name="assigned_estimator_id">
              <option value="">Unassigned</option>
              {(estimators || []).map((estimator) => (
                <option key={estimator.user_id} value={estimator.user_id}>
                  {estimator.display_name || estimator.notification_email || "Bid Estimator"}
                </option>
              ))}
            </SelectField>
            <Field
              label="Estimated Contract Value"
              name="estimated_contract_value"
              type="number"
              min="0"
              step="0.01"
            />
            <Field
              label="Probability (%)"
              name="probability"
              type="number"
              min="0"
              max="100"
              step="1"
            />
            <SelectField label="Priority" name="priority" defaultValue="normal">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </SelectField>
          </div>
        </FormSection>

        <FormSection title="Initial Scope & Notes">
          <div className="space-y-5">
            <TextArea label="Scope Summary" name="scope_summary" rows={5} />
            <TextArea label="Exclusion Information" name="exclusion_notes" rows={4} />
            <TextArea label="General Notes" name="notes" rows={4} />
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <a
            href="/admin/bids"
            className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
          >
            Create Opportunity
          </button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  min,
  max,
  step,
  wide = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: string;
  max?: string;
  step?: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-sm text-neutral-300">
        {label}{required ? " *" : ""}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm text-neutral-300">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 pr-10 text-white outline-none focus:border-[#fb5411]"
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, name, rows }: { label: string; name: string; rows: number }) {
  return (
    <label>
      <span className="mb-2 block text-sm text-neutral-300">{label}</span>
      <textarea
        name={name}
        rows={rows}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

function textValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function optionalText(formData: FormData, name: string) {
  return textValue(formData, name) || null;
}

function optionalNumber(formData: FormData, name: string) {
  const value = textValue(formData, name);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be a valid number.`);
  return number;
}
