import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
  const supabase = await createClient();

  const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading leads:", error);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-10 pb-10 pt-36 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="mt-2 text-neutral-400">
            Track new inquiries, follow-ups, and job status.
          </p>
        </div>

        <Link
          href="/admin/leads/new"
          className="rounded-lg bg-[#fb5411] px-4 py-3 font-semibold text-white hover:bg-[#e64d0f]"
        >
          New Lead
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Project Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Next Follow-Up</th>
            </tr>
          </thead>

          <tbody>
            {leads && leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="hover:text-[#fb5411]"
                    >
                      {lead.customer_name}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {lead.project_type || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {lead.status || "new"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {lead.lead_source || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {lead.next_follow_up_at
                      ? new Date(lead.next_follow_up_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-neutral-400" colSpan={5}>
                  No leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}