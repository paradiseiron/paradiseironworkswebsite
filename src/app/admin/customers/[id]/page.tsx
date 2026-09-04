import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, MapPin, Phone, Plus } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatWashingtonDate } from "@/lib/date-time";
import { formatCurrency } from "@/lib/proposal-pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: customer, error }, { data: projects }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("id, customer_name, project_type, project_category, status, proposal_amount, received_at, completed_at").eq("customer_id", id).order("received_at", { ascending: false }),
  ]);
  if (error || !customer) notFound();
  const canCreate = role === "admin" || role === "estimator" || role === "operations_foreman";
  const address = [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(", ");

  return <div className="mx-auto max-w-6xl">
    <Link href="/admin/projects" className="mb-5 inline-flex text-sm text-neutral-400 transition hover:text-white">← Back to projects</Link>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">Customer profile</p><h1 className="mt-2 text-3xl font-semibold">{customer.name}</h1></div>
      {canCreate && <Link href={`/admin/projects/new?customer=${customer.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Start a new project</Link>}
    </div>
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Customer information</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Primary contact" value={customer.contact_name || customer.name} />
        <Detail label="Phone" value={customer.phone} icon={<Phone className="h-4 w-4" />} />
        <Detail label="Email" value={customer.email} icon={<Mail className="h-4 w-4" />} />
        <Detail label="Default address" value={address} icon={<MapPin className="h-4 w-4" />} />
      </div>
    </section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="p-5 sm:p-6"><h2 className="text-xl font-semibold">Project history</h2><p className="mt-1 text-sm text-neutral-400">{projects?.length || 0} project{projects?.length === 1 ? "" : "s"} for this customer.</p></div>
      {projects?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-t border-white/10 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-6 py-3">Project</th><th className="px-6 py-3">Received</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Value</th><th className="px-6 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="border-t border-white/10"><td className="px-6 py-4 font-medium text-white">{project.project_type || project.project_category || "Project"}</td><td className="px-6 py-4 text-neutral-400">{project.received_at ? formatWashingtonDate(project.received_at) : "—"}</td><td className="px-6 py-4 capitalize text-neutral-300">{project.status || "lead"}</td><td className="px-6 py-4 text-right text-neutral-300">{formatCurrency(Number(project.proposal_amount || 0))}</td><td className="px-6 py-4 text-right"><Link href={`/admin/projects/${project.id}`} className="inline-flex items-center gap-1 text-[#fb5411]">Open <ArrowRight className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div> : <p className="border-t border-white/10 p-6 text-sm text-neutral-400">No projects are linked to this customer yet.</p>}
    </section>
  </div>;
}

function Detail({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) { return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p><p className="mt-2 flex items-center gap-2 text-sm text-neutral-200">{icon}{value || "—"}</p></div>; }
