import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatWashingtonDate } from "@/lib/date-time";
import { formatCurrency, getInvoiceNumber, getProjectLocation } from "@/lib/invoice";

export default async function FinalReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
  const { id } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !project) notFound();
  if (project.status !== "completed") redirect(`/admin/projects/${id}?tab=close`);

  const amount = Number(project.proposal_amount || 0);
  const receiptNumber = getInvoiceNumber(project).replace(/^INV-/, "REC-");
  return (
    <main className="min-h-screen bg-neutral-200 py-4 text-neutral-950 sm:px-4 sm:py-8 print:min-h-0 print:bg-white print:p-0">
      <article className="mx-auto max-w-[850px] bg-white px-5 py-8 shadow-xl sm:px-10 sm:py-10 md:px-14 md:py-12 print:max-w-none print:shadow-none">
        <header className="flex flex-col-reverse gap-6 border-b border-neutral-300 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Paradise Ironworks &amp; Construction LLC</p><h1 className="mt-5 text-4xl font-bold">Final Receipt</h1><div className="mt-4 text-sm text-neutral-600"><p><strong>Receipt #:</strong> {receiptNumber}</p><p><strong>Date:</strong> {formatWashingtonDate(new Date())}</p><p><strong>Status:</strong> Paid in full</p></div></div>
          <Image src="/images/paradise_ironworks_logo.png" alt="Paradise Ironworks Logo" width={320} height={160} className="h-20 w-auto object-contain" />
        </header>
        <section className="mt-8 grid gap-8 text-sm sm:grid-cols-2">
          <div><h2 className="font-semibold uppercase tracking-wide text-neutral-500">Received From</h2><p className="mt-2 font-medium">{project.contact_name || project.customer_name || "—"}</p><p className="mt-1">{project.email || "—"}</p><p className="mt-1">{project.phone || "—"}</p></div>
          <div><h2 className="font-semibold uppercase tracking-wide text-neutral-500">Project</h2><p className="mt-2 font-medium">{project.proposal_project_name || project.project_type || project.customer_name || "—"}</p><p className="mt-2">{getProjectLocation(project) || "—"}</p></div>
        </section>
        <section className="mt-10 overflow-hidden border border-neutral-300 text-sm"><div className="grid grid-cols-[1fr_150px] bg-neutral-100 font-semibold"><div className="border-r border-neutral-300 px-4 py-3">Description</div><div className="px-4 py-3 text-right">Amount</div></div><div className="grid grid-cols-[1fr_150px] border-t border-neutral-300"><div className="border-r border-neutral-300 px-4 py-4">Final payment received for completed project</div><div className="px-4 py-4 text-right">{formatCurrency(amount)}</div></div><div className="grid grid-cols-[1fr_150px] border-t-2 border-neutral-500 bg-neutral-50 font-bold"><div className="px-4 py-4 text-right">Balance Due</div><div className="border-l border-neutral-300 px-4 py-4 text-right">{formatCurrency(0)}</div></div></section>
        <p className="mt-8 text-sm leading-6 text-neutral-600">Thank you for choosing Paradise Ironworks &amp; Construction LLC. This receipt acknowledges payment in full for the project shown above.</p>
        <div className="mt-8 flex gap-3 print:hidden"><Link href={`/admin/projects/${id}?tab=close`} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold">Back to Close</Link><Link href={`/admin/projects/${id}/receipt/pdf`} className="rounded-lg bg-[#fb5411] px-4 py-2 text-sm font-semibold text-white">Download PDF</Link></div>
      </article>
    </main>
  );
}
