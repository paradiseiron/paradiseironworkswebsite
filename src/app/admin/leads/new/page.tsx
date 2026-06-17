import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function createLead(formData: FormData) {
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
  const lead_source = String(formData.get("lead_source") || "");
  const project_type = String(formData.get("project_type") || "");
  const priority = String(formData.get("priority") || "normal");
  const notes = String(formData.get("notes") || "");

  if (!customer_name.trim()) {
    throw new Error("Customer name is required");
  }

  const { error } = await supabase.from("leads").insert({
    customer_name,
    contact_name,
    phone,
    email,
    project_address,
    city,
    state,
    zip_code,
    lead_source,
    project_type,
    priority,
    status: "new",
    notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/leads");
}

export default async function NewLeadPage() {
  const supabase = await createClient();

 const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}

  return (
    <div>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold">New Lead</h1>
        <p className="mt-2 text-neutral-400">
          Add a new inquiry to the Paradise internal lead tracker.
        </p>

        <form action={createLead} className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Customer Name *
              </label>
              <input
                name="customer_name"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Contact Name
              </label>
              <input
                name="contact_name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Phone
              </label>
              <input
                name="phone"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Email
              </label>
              <input
                name="email"
                type="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-neutral-300">
                Project Address
              </label>
              <input
                name="project_address"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                City
              </label>
              <input
                name="city"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                State
              </label>
              <input
                name="state"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                ZIP Code
              </label>
              <input
                name="zip_code"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Lead Source
              </label>
              <select
                name="lead_source"
                className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              >
                <option value="">Select source</option>
                <option value="website">Website</option>
                <option value="google">Google</option>
                <option value="referral">Referral</option>
                <option value="instagram">Instagram</option>
                <option value="repeat_customer">Repeat Customer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Project Type
              </label>
              <select
                name="project_type"
                className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              >
                <option value="">Select project type</option>
                <option value="exterior_railing">Exterior Railing</option>
                <option value="interior_railing">Interior Railing</option>
                <option value="gate">Gate</option>
                <option value="fence">Fence</option>
                <option value="storm_door">Storm Door</option>
                <option value="structural_steel">Structural Steel</option>
                <option value="commercial_metalwork">Commercial Metalwork</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-300">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="normal"
                className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
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

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-[#fb5411] px-5 py-3 font-semibold text-white hover:bg-[#e64d0f]"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}