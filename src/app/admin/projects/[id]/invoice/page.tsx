import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatWashingtonDate } from "@/lib/date-time";
import {
  formatCurrency,
  getInvoiceLineItems,
  getInvoiceSummary,
  getProjectLocation,
} from "@/lib/invoice";

export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  await requireAuthenticatedUser();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  if (!["active", "completed"].includes(String(project.status || ""))) {
    redirect(`/admin/projects/${id}?tab=invoice`);
  }

  const summary = getInvoiceSummary(project);
  const lineItems = getInvoiceLineItems(summary);
  const projectLocation = getProjectLocation(project);

  return (
    <main className="min-h-screen bg-neutral-200 py-4 text-neutral-950 sm:px-4 sm:py-8 print:min-h-0 print:bg-white print:p-0">
      <article className="mx-auto max-w-[850px] bg-white px-5 py-8 shadow-xl sm:px-10 sm:py-10 md:px-14 md:py-12 print:max-w-none print:shadow-none">
        <header className="border-b border-neutral-300 pb-6">
          <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
                Paradise Ironworks & Construction LLC
              </p>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:mt-6 sm:text-4xl">
                Invoice
              </h1>

              <div className="mt-4 text-sm text-neutral-600">
                <p>
                  <strong>Invoice #:</strong> {summary.invoiceNumber}
                </p>
                <p>
                  <strong>Date:</strong> {formatWashingtonDate(new Date())}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="capitalize">{project.status || "—"}</span>
                </p>
              </div>
            </div>

            <Image
              src="/images/paradise_ironworks_logo.png"
              alt="Paradise Ironworks Logo"
              width={320}
              height={160}
              className="h-16 w-auto self-start object-contain sm:h-24"
            />
          </div>
        </header>

        <section className="mt-8 grid gap-6 text-sm sm:grid-cols-2 sm:gap-10">
          <div>
            <h2 className="font-semibold uppercase tracking-wide text-neutral-500">
              Bill To
            </h2>
            <p className="mt-2 font-medium">
              {project.contact_name || project.customer_name || "—"}
            </p>
            <p className="mt-1">{project.customer_name || "—"}</p>
            <p className="mt-1">{project.email || "—"}</p>
            <p className="mt-1">{project.phone || "—"}</p>
          </div>

          <div>
            <h2 className="font-semibold uppercase tracking-wide text-neutral-500">
              Project
            </h2>
            <p className="mt-2 font-medium">
              {project.proposal_project_name || project.customer_name || "—"}
            </p>

            <h2 className="mt-5 font-semibold uppercase tracking-wide text-neutral-500">
              Project Location
            </h2>
            <p className="mt-2 whitespace-pre-wrap">
              {projectLocation || "—"}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold">Invoice Summary</h2>

          <div className="mt-3 overflow-hidden border border-neutral-300 text-sm">
            <div className="grid grid-cols-[1fr_150px] bg-neutral-100 font-semibold">
              <div className="border-r border-neutral-300 px-3 py-2">
                Description
              </div>
              <div className="px-3 py-2 text-right">Amount</div>
            </div>

            {lineItems.map((item) => (
              <div
                key={item.description}
                className="grid grid-cols-[1fr_150px] border-t border-neutral-300"
              >
                <div className="border-r border-neutral-300 px-3 py-2">
                  {item.description}
                </div>
                <div className="px-3 py-2 text-right">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-[1fr_150px] border-t border-neutral-400 font-bold">
              <div className="px-3 py-2 text-right">Total Due</div>
              <div className="border-l border-neutral-300 px-3 py-2 text-right">
                {formatCurrency(summary.amountDue)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
          <InvoiceMetric
            label="Contract Amount"
            value={formatCurrency(summary.contractAmount)}
          />
          <InvoiceMetric
            label="Paid / Credited"
            value={formatCurrency(summary.paidToDate)}
          />
          <InvoiceMetric
            label="Balance Due"
            value={formatCurrency(summary.amountDue)}
          />
        </section>

        <section className="mt-10 border-t border-neutral-300 pt-6 text-sm leading-7">
          <p>
            Payment is due upon receipt unless otherwise agreed in writing.
            Please reference {summary.invoiceNumber} with payment.
          </p>
          <p className="mt-4 font-semibold">
            Paradise Ironworks & Construction LLC
          </p>
        </section>
      </article>
    </main>
  );
}

function InvoiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-300 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
