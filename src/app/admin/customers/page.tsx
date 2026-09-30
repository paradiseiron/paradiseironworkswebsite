import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerTypeLabel } from "@/lib/customer-types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
  const supabase = createAdminClient();
  const customers = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("customers").select("id, name, customer_type, contact_name, phone, email, city, state").order("name", { ascending: true }).range(offset, offset + 999);
    if (error) throw error;
    customers.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  return <div className="mx-auto max-w-6xl">
    <h1 className="text-3xl font-semibold">Customers</h1>
    <p className="mt-2 text-sm text-neutral-400">{customers?.length || 0} customer{customers?.length === 1 ? "" : "s"}</p>
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Location</th></tr></thead>
        <tbody>{customers?.map((customer) => <tr key={customer.id} className="border-t border-white/10 text-neutral-300"><td className="px-5 py-4 font-medium"><Link className="text-white hover:text-[#fb5411]" href={`/admin/customers/${customer.id}`}>{customer.name}</Link></td><td className="px-5 py-4">{customerTypeLabel(customer.customer_type)}</td><td className="px-5 py-4">{customer.contact_name || "—"}</td><td className="px-5 py-4">{customer.phone || "—"}</td><td className="px-5 py-4">{customer.email || "—"}</td><td className="px-5 py-4">{[customer.city, customer.state].filter(Boolean).join(", ") || "—"}</td></tr>)}</tbody>
      </table>
      {!customers?.length && <p className="border-t border-white/10 p-5 text-neutral-400">No customers yet.</p>}
    </div>
  </div>;
}
