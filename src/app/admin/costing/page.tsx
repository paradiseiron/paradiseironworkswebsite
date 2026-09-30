import Link from "next/link";
import { FileCheck2, FileClock, ReceiptText } from "lucide-react";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import CostDocumentUpload from "@/components/CostDocumentUpload";
import SuccessToast from "@/components/SuccessToast";
import { costCategoryLabel, formatCost } from "@/lib/costing";

export const dynamic = "force-dynamic";

export default async function CostingPage({ searchParams }: { searchParams: Promise<{ tab?: string; toast?: string }> }) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  const filters = await searchParams;
  const tab = filters.tab === "costs" ? "costs" : "inbox";
  const supabase = createAdminClient();
  const [{ data: intake, error: intakeError }, { data: costs, error: costsError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.from("cost_intake").select("id, project_id, bid_opportunity_id, is_general_expense, file_name, status, vendor_name, amount, document_date, created_at, projects(customer_name, proposal_number), bid_opportunities(project_name, proposal_number)").order("created_at", { ascending: false }),
    supabase.from("project_costs").select("id, project_id, bid_opportunity_id, is_general_expense, vendor_name, amount, document_date, invoice_number, category, created_at, projects(customer_name, proposal_number), bid_opportunities(project_name, proposal_number)").order("document_date", { ascending: false }),
    supabase.from("projects").select("id, customer_name, proposal_number, status").eq("status", "active").order("received_at", { ascending: false }),
  ]);
  if (intakeError || costsError || projectsError) throw new Error(intakeError?.message || costsError?.message || projectsError?.message || "Unable to load costing.");
  const projectOptions = (projects || []).map(p => ({ id: String(p.id), label: [p.customer_name, p.proposal_number].filter(Boolean).join(" · ") }));
  const canWrite = role !== "viewer" && role !== "unassigned";
  const pending = (intake || []).filter(item => !["approved", "rejected"].includes(item.status));
  const total = (costs || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return <div className="mx-auto max-w-7xl">
    {(filters.toast === "approved" || filters.toast === "rejected") && <SuccessToast queryParam="toast" message={filters.toast === "approved" ? "Project cost approved and added to the ledger." : "Cost document rejected."} />}
    <div className="flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-2xl font-semibold sm:text-3xl">Costing</h1><p className="mt-2 text-neutral-400">Review cost documents and track verified project costs.</p></div>{canWrite && <CostDocumentUpload projects={projectOptions} />}</div>
    <div className="mt-8 flex gap-6 border-b border-white/10">
      <Tab href="/admin/costing" active={tab === "inbox"}>Cost Inbox <span className="ml-1 text-neutral-500">{pending.length}</span></Tab>
      <Tab href="/admin/costing?tab=costs" active={tab === "costs"}>Project Costs</Tab>
    </div>
    {tab === "inbox" ? <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      {pending.length ? <div className="divide-y divide-white/10">{pending.map(item => <Link key={item.id} href={`/admin/costing/${item.id}`} className="grid gap-3 p-4 transition hover:bg-white/[0.04] sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_140px_120px] sm:items-center sm:p-5">
        <div className="min-w-0"><p className="truncate font-medium text-white">{item.file_name}</p><p className="mt-1 text-xs text-neutral-500">Uploaded {new Date(item.created_at).toLocaleDateString()}</p></div>
        <div className="text-sm text-neutral-300">{assignmentName(item)}</div><div className="text-sm text-neutral-300">{formatCost(item.amount)}</div><Status value={item.status} />
      </Link>)}</div> : <Empty icon={<FileClock className="size-7" />} title="Cost inbox is clear" copy="Upload an invoice or receipt to begin a cost review." />}
    </section> : <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><Metric label="Verified project costs" value={formatCost(total)} icon={<ReceiptText className="size-5" />} /><Metric label="Approved documents" value={String((costs || []).length)} icon={<FileCheck2 className="size-5" />} /></div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">{costs?.length ? <div className="divide-y divide-white/10">{costs.map(cost => <div key={cost.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_160px_140px] sm:items-center sm:p-5"><div><p className="font-medium">{cost.vendor_name}</p><p className="mt-1 text-xs text-neutral-500">{cost.invoice_number ? `Invoice ${cost.invoice_number}` : costCategoryLabel(cost.category)}</p></div><p className="text-sm text-neutral-300">{assignmentName(cost)}</p><p className="text-sm text-neutral-400">{new Date(`${cost.document_date}T12:00:00`).toLocaleDateString()}</p><p className="font-semibold">{formatCost(cost.amount)}</p></div>)}</div> : <Empty icon={<ReceiptText className="size-7" />} title="No verified costs yet" copy="Approved intake documents appear here." />}</section>
    </>}
  </div>;
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) { return <Link href={href} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${active ? "border-[#fb5411] text-white" : "border-transparent text-neutral-500 hover:text-neutral-200"}`}>{children}</Link>; }
function Status({ value }: { value: string }) { const label = value.replaceAll("_", " "); return <span className="w-fit rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium capitalize text-amber-300">{label}</span>; }
function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2 text-neutral-500">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div><p className="mt-3 text-2xl font-semibold">{value}</p></div>; }
function Empty({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { return <div className="flex flex-col items-center px-5 py-16 text-center text-neutral-500">{icon}<p className="mt-3 font-medium text-neutral-300">{title}</p><p className="mt-1 text-sm">{copy}</p></div>; }
function projectName(value: unknown) { const project = Array.isArray(value) ? value[0] : value as { customer_name?: string; proposal_number?: string } | null; return project ? [project.customer_name, project.proposal_number].filter(Boolean).join(" · ") : ""; }
function assignmentName(item: { is_general_expense?: boolean; projects?: unknown; bid_opportunities?: unknown }) { if (item.is_general_expense) return "General expense"; const residential = projectName(item.projects); if (residential) return residential; const value = item.bid_opportunities; const bid = Array.isArray(value) ? value[0] : value as { project_name?: string; proposal_number?: string } | null; return bid ? [bid.project_name, bid.proposal_number].filter(Boolean).join(" · ") : "Project not assigned"; }
