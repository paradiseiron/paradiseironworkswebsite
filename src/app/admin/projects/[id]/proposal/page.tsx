import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatWashingtonDate } from "@/lib/date-time";
import {
  formatCurrency,
  normalizeProposalPricingItems,
  proposalPricingTotal,
  type ProposalPricingLineItem,
} from "@/lib/proposal-pricing";

export default async function ProposalPreviewPage({
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

  const projectLocation = [
    project.project_address,
    project.city,
    project.state,
    project.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
  const pricingItems = normalizeProposalPricingItems(
    project.proposal_pricing_items,
    project.proposal_amount,
    project.proposal_pricing
  ).filter(
    (item) => item.description || item.amount !== null || item.price !== null
  );
  const pricingTotal = proposalPricingTotal(pricingItems);

  return (
    <main className="min-h-screen bg-neutral-200 py-4 text-neutral-950 sm:px-4 sm:py-8 print:min-h-0 print:bg-white print:p-0">
     <article className="proposal-document mx-auto max-w-[850px] bg-white px-5 py-8 shadow-xl sm:px-10 sm:py-10 md:px-14 md:py-12 print:max-w-none print:shadow-none">


       <header className="border-b border-neutral-300 pb-6">
  <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
        Paradise Ironworks & Construction LLC
      </p>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:mt-6 sm:text-4xl">
        Proposal
      </h1>

      <div className="mt-4 text-sm text-neutral-600">
        <p>
          <strong>Proposal #:</strong>{" "}
          {project.proposal_number || "Draft"}
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {formatWashingtonDate(new Date())}
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
              Project
            </h2>
            <p className="mt-2 font-medium">
              {project.proposal_project_name ||
                project.customer_name}
            </p>

            <h2 className="mt-5 font-semibold uppercase tracking-wide text-neutral-500">
              Project Location
            </h2>
            <p className="mt-2 whitespace-pre-wrap">
              {projectLocation || "—"}
            </p>
          </div>

          <div>
            <h2 className="font-semibold uppercase tracking-wide text-neutral-500">
              Attention
            </h2>
            <p className="mt-2">
              {project.proposal_attention ||
                project.contact_name ||
                "—"}
            </p>

            <div className="mt-5 space-y-1">
              <p>
                <strong>Office:</strong>{" "}
                {project.proposal_office_phone || "—"}
              </p>
              <p>
                <strong>Cell:</strong>{" "}
                {project.proposal_cell_phone ||
                  project.phone ||
                  "—"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {project.proposal_email ||
                  project.email ||
                  "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 text-sm leading-7">
          <p>
            {project.proposal_intro ||
              "Paradise Ironworks & Construction LLC (PIWC) is pleased to provide the following proposal for the above referenced project."}
          </p>
        </section>

        <ProposalSection
          title="Scope of Work"
          content={project.proposal_scope}
        />

        <ProposalSection
          title="Finish"
          content={project.proposal_finish}
        />

        <ProposalSection
          title="Exclusions"
          content={project.proposal_exclusions}
        />

        <PricingSection items={pricingItems} total={pricingTotal} />

        <ProposalSection
          title="Payment Terms"
          content={
            project.proposal_payment_terms ||
            defaultPaymentTerms(project.proposal_deposit_amount)
          }
        />

        <ProposalSection
          title="Schedule"
          content={project.proposal_schedule}
        />

        <ProposalSection
          title="Clarifications"
          content={project.proposal_clarifications}
        />

        <section className="mt-10 text-sm leading-7">
          <p>
            We appreciate the opportunity to provide this proposal and look
            forward to working with you on this project.
          </p>

          <div className="mt-8">
            <p>Respectfully Submitted,</p>
            <p className="mt-4 font-semibold">
              Paradise Ironworks & Construction LLC
            </p>
            <p className="mt-4">
              {project.proposal_prepared_by || "Ronald Brown"}
            </p>
            <p>
              {project.proposal_prepared_by_title ||
                "Operations & Estimating Director"}
            </p>
          </div>
        </section>

        <section className="mt-12 border-t border-neutral-300 pt-8">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Acceptance of Proposal
          </h2>

          <p className="mt-4 text-sm">
            The above proposal, pricing, scope, and terms are hereby accepted.
          </p>

          <div className="mt-8 space-y-5 text-sm">
            <SignatureLine label="Accepted By" />
            <SignatureLine label="Company" />
            <SignatureLine label="Signature" />
            <SignatureLine label="Date" />
            <SignatureLine label="Purchase Order / Authorization No." />
          </div>
        </section>
      </article>
    </main>
  );
}

function PricingSection({
  items,
  total,
}: {
  items: ProposalPricingLineItem[];
  total: number;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">Pricing</h2>

        <div className="mt-3 overflow-hidden border border-neutral-300 text-sm">
          <div className="grid grid-cols-[1fr_90px_130px] bg-neutral-100 font-semibold">
          <div className="border-r border-neutral-300 px-3 py-2">
            Description
          </div>
          <div className="border-r border-neutral-300 px-3 py-2 text-right">
            Amount
          </div>
          <div className="px-3 py-2 text-right">Price</div>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_90px_130px] border-t border-neutral-300"
          >
            <div className="whitespace-pre-wrap border-r border-neutral-300 px-3 py-2">
              {item.description || "—"}
            </div>
            <div className="border-r border-neutral-300 px-3 py-2 text-right">
              {formatAmount(item.amount)}
            </div>
            <div className="px-3 py-2 text-right">
              {item.price === null ? "—" : formatCurrency(item.price)}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-[1fr_130px] border-t border-neutral-400 font-bold">
          <div className="px-3 py-2 text-right">Total</div>
          <div className="border-l border-neutral-300 px-3 py-2 text-right">
            {formatCurrency(total)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProposalSection({
  title,
  content,
}: {
  title: string;
  content?: string | null;
}) {
  if (!content) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
        {content}
      </div>
    </section>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <span className="font-medium sm:w-56">{label}:</span>
      <span className="flex-1 border-b border-neutral-500" />
    </div>
  );
}

function formatAmount(value: number | null) {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : String(value);
}

function defaultPaymentTerms(deposit?: number | null) {
  if (deposit) {
    return `Deposit Due Upon Acceptance: $${Number(
      deposit
    ).toLocaleString()}\nRemaining Balance Due Upon Completion`;
  }

  return "Deposit due upon acceptance.\nRemaining balance due upon completion.";
}
