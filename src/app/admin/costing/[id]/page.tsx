import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import SuccessToast from "@/components/SuccessToast";
import CostProjectCombobox, { type CostProjectOption } from "@/components/CostProjectCombobox";
import CostExtractionAction from "@/components/CostExtractionAction";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { costCategories } from "@/lib/costing";

const categories = new Set(costCategories.map(([value]) => value));

async function saveReview(id: string, intent: "save" | "approve" | "reject", form: FormData) {
  "use server";
  const user = await requireAuthenticatedUser(); const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") throw new Error("Write access is required.");
  const supabase = createAdminClient();
  const { data: current } = await supabase.from("cost_intake").select("*").eq("id", id).maybeSingle();
  if (!current) throw new Error("Cost document not found.");
  if (current.status === "approved") redirect(`/admin/costing/${id}`);
  if (intent === "reject") {
    const { error } = await supabase.from("cost_intake").update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error("Unable to reject this document.");
    revalidatePath("/admin/costing"); redirect("/admin/costing?toast=rejected");
  }
  const projectSource = String(form.get("project_source") || "").trim();
  const isGeneralExpense = String(form.get("is_general_expense")) === "true";
  const [sourceType, sourceId] = projectSource.split(":");
  const projectId = !isGeneralExpense && sourceType === "project" ? sourceId : null;
  const bidOpportunityId = !isGeneralExpense && sourceType === "bid" ? sourceId : null;
  const vendorName = String(form.get("vendor_name") || "").trim();
  const amount = Number(String(form.get("amount") || ""));
  const documentDate = String(form.get("document_date") || "");
  const category = String(form.get("category") || "");
  if (!isGeneralExpense && !projectId && !bidOpportunityId) throw new Error("Choose a project or mark this as a general expense.");
  if (projectId) {
    const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("status", "active").maybeSingle();
    if (!project) throw new Error("Choose an active residential/non-bid project.");
  }
  if (bidOpportunityId) {
    const { data: bid } = await supabase.from("bid_opportunities").select("id").eq("id", bidOpportunityId).eq("status", "won").maybeSingle();
    if (!bid) throw new Error("Choose a won commercial bid project.");
  }
  if (!vendorName) throw new Error("Enter the vendor name.");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid amount.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(documentDate)) throw new Error("Enter the document date.");
  if (!categories.has(category as never)) throw new Error("Choose a cost category.");
  const values = { project_id: projectId, bid_opportunity_id: bidOpportunityId, is_general_expense: isGeneralExpense, vendor_name: vendorName, amount, document_date: documentDate, invoice_number: optional(form, "invoice_number"), purchase_order_number: optional(form, "purchase_order_number"), category, description: optional(form, "description"), updated_at: new Date().toISOString() };
  if (intent === "approve") {
    const { error: costError } = await supabase.from("project_costs").insert({ ...values, source_intake_id: id, storage_path: current.storage_path, created_by: user.id });
    if (costError) throw new Error(costError.code === "23505" ? "This document has already been approved." : "Unable to create the project cost.");
    const { error } = await supabase.from("cost_intake").update({ ...values, status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { await supabase.from("project_costs").delete().eq("source_intake_id", id); throw new Error("Unable to complete approval."); }
    revalidatePath("/admin/costing"); redirect("/admin/costing?tab=costs&toast=approved");
  }
  const { error } = await supabase.from("cost_intake").update({ ...values, status: "needs_review" }).eq("id", id);
  if (error) throw new Error("Unable to save the review.");
  revalidatePath(`/admin/costing/${id}`); redirect(`/admin/costing/${id}?toast=saved`);
}

export const dynamic = "force-dynamic";
export default async function CostReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ toast?: string }> }) {
  const user = await requireAuthenticatedUser(); const role = await getUserRole(user.id); const { id } = await params; const query = await searchParams; const supabase = createAdminClient();
  const [{ data: item }, { data: projects }, { data: bids }] = await Promise.all([
    supabase.from("cost_intake").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("id, customer_name, proposal_number").eq("status", "active").order("received_at", { ascending: false }),
    supabase.from("bid_opportunities").select("id, project_name, proposal_number, general_contractor").eq("status", "won").order("outcome_at", { ascending: false }),
  ]);
  if (!item) notFound();
  const signed = (await supabase.storage.from("cost-documents").createSignedUrl(item.storage_path, 3600)).data?.signedUrl || "";
  const canWrite = role !== "viewer" && role !== "unassigned" && item.status !== "approved";
  const action = saveReview.bind(null, id);
  const projectOptions: CostProjectOption[] = [
    ...(projects || []).map(project => ({ value: `project:${project.id}`, label: [project.customer_name, project.proposal_number].filter(Boolean).join(" · "), group: "Residential / Non-bid" as const })),
    ...(bids || []).map(bid => ({ value: `bid:${bid.id}`, label: [bid.project_name, bid.proposal_number, bid.general_contractor].filter(Boolean).join(" · "), group: "Commercial Bid" as const })),
  ];
  const defaultProjectSource = item.project_id ? `project:${item.project_id}` : item.bid_opportunity_id ? `bid:${item.bid_opportunity_id}` : "";
  return <div className="mx-auto max-w-7xl">
    {(query.toast === "uploaded" || query.toast === "saved" || query.toast === "extracted") && <SuccessToast queryParam="toast" message={query.toast === "uploaded" ? "Cost document uploaded and analyzed." : query.toast === "extracted" ? "AI extraction completed. Review the suggested details." : "Cost review saved."} />}
    <Link href="/admin/costing" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft className="size-4" />Back to Costing</Link>
    <div className="mt-6"><h1 className="break-words text-2xl font-semibold sm:text-3xl">Review cost document</h1><p className="mt-2 text-neutral-400">Confirm the source document and assign its verified project cost details.</p></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,.85fr)]">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"><div className="flex items-center justify-between gap-3 border-b border-white/10 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.file_name}</p><p className="mt-1 text-xs text-neutral-500">{(item.size_bytes / 1024 / 1024).toFixed(1)} MB</p></div>{signed && <a href={signed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">Open <ExternalLink className="size-4" /></a>}</div><div className="relative h-[65vh] min-h-[520px] bg-neutral-900">{item.content_type.startsWith("image/") ? <Image unoptimized fill src={signed} alt="Uploaded cost document" className="object-contain" /> : <iframe title="Cost document preview" src={signed} className="h-full w-full" />}</div></section>
      <form action={action.bind(null, "save")} className="h-fit rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Cost details</h2>{item.extracted_at && <p className="mt-1 text-xs text-neutral-500">AI suggestion · {Math.round(Number(item.extraction_confidence?.overall || 0) * 100)}% overall confidence</p>}</div><span className={`rounded-full px-2.5 py-1 text-xs capitalize ${item.status === "failed" ? "bg-red-500/10 text-red-300" : item.status === "processing" ? "bg-blue-500/10 text-blue-300" : "bg-amber-500/10 text-amber-300"}`}>{item.status.replaceAll("_", " ")}</span></div>
        {item.failure_message && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3"><p className="text-sm text-red-300">AI extraction failed</p><p className="mt-1 text-xs text-red-200/70">{item.failure_message}</p></div>}
        <div className="mt-6 space-y-5"><Field label="Project"><CostProjectCombobox options={projectOptions} defaultValue={defaultProjectSource} defaultGeneral={item.is_general_expense} disabled={!canWrite} /></Field>
        <Field label="Vendor"><input name="vendor_name" required defaultValue={item.vendor_name || ""} disabled={!canWrite} className={input} /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Amount"><input name="amount" required type="number" min="0" step="0.01" defaultValue={item.amount ?? ""} disabled={!canWrite} className={input} /></Field><Field label="Document date"><input name="document_date" required type="date" defaultValue={item.document_date || ""} disabled={!canWrite} className={input} /></Field></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Invoice number"><input name="invoice_number" defaultValue={item.invoice_number || ""} disabled={!canWrite} className={input} /></Field><Field label="PO number"><input name="purchase_order_number" defaultValue={item.purchase_order_number || ""} disabled={!canWrite} className={input} /></Field></div>
        <Field label="Category"><Select name="category" required defaultValue={item.category || ""} disabled={!canWrite}><option value="">Choose a category</option>{costCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
        <Field label="Description"><textarea name="description" rows={4} defaultValue={item.description || ""} disabled={!canWrite} className={`${input} h-auto py-3`} /></Field></div>
        {canWrite && <div className="mt-6 flex flex-wrap items-start justify-between gap-3"><CostExtractionAction intakeId={id} retry={item.status === "failed" || Boolean(item.extracted_at)} /><div className="flex flex-wrap justify-end gap-3"><button formAction={action.bind(null, "reject")} formNoValidate className="h-11 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10">Reject</button><button className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 hover:bg-white/5">Save Draft</button><button formAction={action.bind(null, "approve")} className="h-11 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white hover:bg-[#e64d0f]">Approve Cost</button></div></div>}
      </form>
    </div>
  </div>;
}
const input = "mt-2 h-12 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-sm text-white outline-none focus:border-[#fb5411]/60 disabled:opacity-60";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm text-neutral-300">{label}{children}</label>; }
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <span className="relative mt-2 block"><select {...props} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-4 pr-11 text-sm text-white outline-none focus:border-[#fb5411]/60 disabled:opacity-60">{children}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-neutral-500" /></span>; }
function optional(form: FormData, key: string) { return String(form.get(key) || "").trim() || null; }
