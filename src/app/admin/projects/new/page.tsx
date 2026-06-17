import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createProject(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const customer_name = String(formData.get("customer_name") || "");
  const contact_name = String(formData.get("contact_name") || "");
  const phone = String(formData.get("phone") || "");
  const email = String(formData.get("email") || "");

  const project_address = String(formData.get("project_address") || "");
  const city = String(formData.get("city") || "");
  const state = String(formData.get("state") || "");
  const zip_code = String(formData.get("zip_code") || "");

  const project_category = String(formData.get("project_category") || "");
  const project_type = String(formData.get("project_type") || "");
  const lead_source = String(formData.get("lead_source") || "");
  const priority = String(formData.get("priority") || "normal");
  const notes = String(formData.get("notes") || "");

  const next_follow_up_at = String(
    formData.get("next_follow_up_at") || ""
  );

  if (!customer_name.trim()) {
    throw new Error("Customer name is required.");
  }

  if (!project_category) {
    throw new Error("Project category is required.");
  }

  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({
      customer_name,
      contact_name,
      phone,
      email,
      project_address,
      city,
      state,
      zip_code,
      project_category,
      project_type,
      lead_source,
      priority,
      status: "lead",
      received_at: new Date().toISOString(),
      next_follow_up_at: next_follow_up_at || null,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: activityError } = await supabase
    .from("project_activities")
    .insert({
      project_id: newProject.id,
      activity_type: "status_change",
      summary: "Lead received and project record created.",
    });

  if (activityError) {
    throw new Error(activityError.message);
  }

  redirect("/admin/projects");
}

export default async function NewProjectPage() {
  const supabase = await createClient();

 const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">New Project</h1>

        <p className="mt-2 text-neutral-400">
          Add a new project or lead to the Paradise project pipeline.
        </p>
      </div>

      <form id="new-project-form" action={createProject} className="max-w-4xl space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Customer Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Customer Name *"
              name="customer_name"
              required
            />

            <Field label="Contact Name" name="contact_name" />

            <Field label="Phone" name="phone" />

            <Field label="Email" name="email" type="email" />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Project Location
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Project Address"
                name="project_address"
              />
            </div>

            <Field label="City" name="city" />
            <Field label="State" name="state" />
            <Field label="ZIP Code" name="zip_code" />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Project Details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SelectField
              label="Project Category *"
              name="project_category"
              required
              options={[
                {
                  value: "",
                  label: "Select category",
                  disabled: true,
                },
                {
                  value: "residential",
                  label: "Residential",
                },
                {
                  value: "commercial",
                  label: "Commercial",
                },
              ]}
            />

            <SelectField
              label="Project Type"
              name="project_type"
              options={[
                {
                  value: "",
                  label: "Select project type",
                },
                {
                  value: "Exterior Railing",
                  label: "Exterior Railing",
                },
                {
                  value: "Interior Railing",
                  label: "Interior Railing",
                },
                {
                  value: "Gate",
                  label: "Gate",
                },
                {
                  value: "Fence",
                  label: "Fence",
                },
                {
                  value: "Storm Door",
                  label: "Storm Door",
                },
                {
                  value: "Structural Steel",
                  label: "Structural Steel",
                },
                {
                  value: "Commercial Metalwork",
                  label: "Commercial Metalwork",
                },
                {
                  value: "Repair / Restoration",
                  label: "Repair / Restoration",
                },
                {
                  value: "Other",
                  label: "Other",
                },
              ]}
            />

            <SelectField
              label="Lead Source"
              name="lead_source"
              options={[
                {
                  value: "",
                  label: "Select source",
                },
                {
                  value: "Website",
                  label: "Website",
                },
                {
                  value: "Google",
                  label: "Google",
                },
                {
                  value: "Referral",
                  label: "Referral",
                },
                {
                  value: "Instagram",
                  label: "Instagram",
                },
                {
                  value: "Repeat Customer",
                  label: "Repeat Customer",
                },
                {
                  value: "Property Manager / HOA",
                  label: "Property Manager / HOA",
                },
                {
                  value: "Contractor",
                  label: "Contractor",
                },
                {
                  value: "Other",
                  label: "Other",
                },
              ]}
            />

            <SelectField
              label="Priority"
              name="priority"
              defaultValue="normal"
              options={[
                {
                  value: "low",
                  label: "Low",
                },
                {
                  value: "normal",
                  label: "Normal",
                },
                {
                  value: "high",
                  label: "High",
                },
              ]}
            />

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Next Follow-Up
              </label>

              <input
                name="next_follow_up_at"
                type="date"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-neutral-300">
                Notes
              </label>

              <textarea
                name="notes"
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>
          </div>
        </section>

    
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-300">
        {label}
      </label>

      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  options: { value: string; label: string; disabled?: boolean }[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-300">
        {label}
      </label>

      <div className="relative">
        <select
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 pr-14 text-white outline-none focus:border-[#fb5411]"
        >
          {options.map((option) => (
            <option
              key={option.value || option.label}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-white/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}