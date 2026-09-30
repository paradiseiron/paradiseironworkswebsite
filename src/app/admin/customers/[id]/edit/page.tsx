import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerNameKey } from "@/lib/customers";
import { CUSTOMER_TYPES, isCustomerType } from "@/lib/customer-types";

export const dynamic = "force-dynamic";

async function updateCustomer(id: string, formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const name = String(formData.get("name") || "").trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Customer name is required.");
  const customerType = String(formData.get("customer_type") || "").trim();
  if (!isCustomerType(customerType)) throw new Error("Invalid customer type.");
  const fields = ["customer_type", "contact_name", "phone", "email", "address", "city", "state", "zip_code"] as const;
  const updates = Object.fromEntries(fields.map((field) => [field, String(formData.get(field) || "").trim() || null]));
  const supabase = createAdminClient();
  const { data: current } = await supabase.from("customers").select("name").eq("id", id).single();
  if (!current) throw new Error("Customer not found.");
  const { data: existing, error: lookupError } = await supabase.from("customers").select("id").eq("name_key", customerNameKey(name)).neq("id", id).maybeSingle();
  if (lookupError) throw new Error("Unable to check for an existing customer.");
  if (existing) {
    const { error: saveError } = await supabase.from("customers").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
    if (saveError) throw new Error("Unable to save the duplicate profile's details.");
    redirect(`/admin/customers/${id}/edit?merge=${existing.id}`);
  }
  const { error } = await supabase.from("customers").update({ name, name_key: customerNameKey(name), ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error?.code === "23505") {
    const { data: match } = await supabase.from("customers").select("id").eq("name_key", customerNameKey(name)).maybeSingle();
    if (match) redirect(`/admin/customers/${id}/edit?merge=${match.id}`);
  }
  if (error) throw new Error("Unable to update customer.");
  if (current.name !== name) {
    const { error: projectError } = await supabase.from("projects").update({ customer_name: name }).eq("customer_id", id);
    if (projectError) throw new Error("Customer saved, but linked project names could not be updated.");
  }
  redirect(`/admin/customers/${id}`);
}

async function mergeCustomer(sourceId: string, targetId: string) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  if (sourceId === targetId) throw new Error("Choose a different customer to merge into.");
  const supabase = createAdminClient();
  const [{ data: source, error: sourceError }, { data: target, error: targetError }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", sourceId).single(),
    supabase.from("customers").select("*").eq("id", targetId).single(),
  ]);
  if (sourceError || targetError || !source || !target) throw new Error("One of the customer profiles no longer exists.");

  // Keep the established profile's details, filling only fields it does not have.
  const fields = ["customer_type", "contact_name", "phone", "email", "address", "city", "state", "zip_code"] as const;
  const missingDetails = Object.fromEntries(fields.filter((field) => !target[field] && source[field]).map((field) => [field, source[field]]));
  if (Object.keys(missingDetails).length) {
    const { error } = await supabase.from("customers").update({ ...missingDetails, updated_at: new Date().toISOString() }).eq("id", targetId);
    if (error) throw new Error("Unable to merge customer details.");
  }
  const { error: projectsError } = await supabase.from("projects").update({ customer_id: targetId, customer_name: target.name }).eq("customer_id", sourceId);
  if (projectsError) throw new Error("Unable to move the duplicate customer's projects.");
  const { error: deleteError } = await supabase.from("customers").delete().eq("id", sourceId);
  if (deleteError) throw new Error("Projects were moved, but the duplicate profile could not be removed.");
  redirect(`/admin/customers/${targetId}`);
}

export default async function EditCustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ merge?: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await params;
  const { merge: mergeId } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: customer }, { data: mergeTarget }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    mergeId && mergeId !== id ? supabase.from("customers").select("id, name").eq("id", mergeId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!customer) notFound();
  return <div className="mx-auto max-w-3xl">
    <h1 className="mt-5 text-3xl font-semibold">Edit customer</h1>
    {mergeTarget && <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <h2 className="text-lg font-semibold">Merge duplicate customer?</h2>
      <p className="mt-2 text-sm text-neutral-300">A profile named <strong>{mergeTarget.name}</strong> already exists. Merge this profile into it to move all linked projects. The existing profile’s information is kept; empty fields are filled from this profile. This duplicate profile will then be deleted.</p>
      <form action={mergeCustomer.bind(null, id, mergeTarget.id)} className="mt-4"><button className="rounded-xl bg-[#fb5411] px-4 py-3 text-sm font-semibold text-white">Merge into {mergeTarget.name}</button></form>
    </section>}
    <form id="edit-customer-form" action={updateCustomer.bind(null, id)} className="mt-8 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
      <Field label="Customer name" name="name" value={customer.name} required />
      <label className="block text-sm text-neutral-300">Customer type<select name="customer_type" defaultValue={customer.customer_type || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white"><option value="">Select customer type</option>{CUSTOMER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select><span className="mt-2 block text-xs text-neutral-400">Choose the customer relationship for future audience segments. This is separate from each project’s category.</span></label>
      <Field label="Primary contact" name="contact_name" value={customer.contact_name} />
      <Field label="Phone" name="phone" value={customer.phone} />
      <Field label="Email" name="email" value={customer.email} type="email" />
      <Field label="Address" name="address" value={customer.address} />
      <Field label="City" name="city" value={customer.city} />
      <Field label="State" name="state" value={customer.state} />
      <Field label="ZIP code" name="zip_code" value={customer.zip_code} />
    </form>
  </div>;
}

function Field({ label, name, value, required, type = "text" }: { label: string; name: string; value?: string | null; required?: boolean; type?: string }) {
  return <label className="block text-sm text-neutral-300">{label}<input name={name} type={type} required={required} defaultValue={value || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#fb5411]" /></label>;
}
