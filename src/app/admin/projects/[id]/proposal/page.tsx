import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { formatWashingtonDate } from "@/lib/date-time";
import {
  formatCurrency,
  normalizeProposalPricingItems,
  proposalPricingTotal,
  type ProposalPricingLineItem,
} from "@/lib/proposal-pricing";
import { DEFAULT_PROPOSAL_TERMS_AND_CONDITIONS } from "@/lib/proposal-terms";
import {
  MHIC_COMMISSION_NOTICE,
  MHIC_DOOR_TO_DOOR_PLACEHOLDER,
  MHIC_DRAFT_CONTRACTOR,
  MHIC_SECURITY_PLACEHOLDER,
} from "@/lib/mhic-contract";

export default async function ProposalPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }
  const mhicDraft = Boolean(project.proposal_mhic_enabled);

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
        {mhicDraft ? "Maryland Home Improvement Contract" : "Proposal"}
      </h1>

      <div className="mt-4 text-sm text-neutral-600">
        <p>
          <strong>Proposal #:</strong>{" "}
          {project.proposal_number || "Draft"}
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {mhicDraft && project.proposal_mhic_contract_date
            ? formatWashingtonDate(project.proposal_mhic_contract_date)
            : formatWashingtonDate(new Date())}
        </p>
      </div>

      {mhicDraft && (
        <div className="mt-4 text-sm leading-6 text-neutral-700">
          <p><strong>Contractor:</strong> {MHIC_DRAFT_CONTRACTOR.licensedBusinessName}</p>
          <p><strong>Licensee:</strong> {MHIC_DRAFT_CONTRACTOR.licenseeName}</p>
          <p><strong>Business address:</strong> {MHIC_DRAFT_CONTRACTOR.address}</p>
          <p><strong>Telephone:</strong> {MHIC_DRAFT_CONTRACTOR.phone}</p>
          <p><strong>MHIC license:</strong> {MHIC_DRAFT_CONTRACTOR.licenseNumber}</p>
          <p><strong>Classification:</strong> {MHIC_DRAFT_CONTRACTOR.licenseClassification}</p>
          <p><strong>License expiration:</strong> {MHIC_DRAFT_CONTRACTOR.licenseExpiration}</p>
          <p><strong>Salesperson:</strong> {MHIC_DRAFT_CONTRACTOR.licenseeName}</p>
          <p><strong>Salesperson license:</strong> {MHIC_DRAFT_CONTRACTOR.licenseNumber}</p>
        </div>
      )}
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

        <ProposalSection
          title="Customer Responsibilities"
          content={project.proposal_customer_responsibilities}
        />

        <PricingSection items={pricingItems} total={pricingTotal} />

        {mhicDraft && (
          <section className={`mt-8 border p-4 text-sm leading-7 ${Number(project.proposal_deposit_amount || 0) > pricingTotal / 3 ? "border-red-500 bg-red-50 text-red-900" : "border-emerald-500 bg-emerald-50 text-emerald-950"}`}>
            <h2 className="text-lg font-bold">Deposit Check</h2>
            <p className="mt-2">
              Proposed deposit: {formatCurrency(Number(project.proposal_deposit_amount || 0))}. Maximum one-third deposit: {formatCurrency(pricingTotal / 3)}.
            </p>
            <p className="font-semibold">
              {Number(project.proposal_deposit_amount || 0) > pricingTotal / 3
                ? "FAIL — reduce the deposit before execution."
                : "PASS — the proposed deposit does not exceed one-third of the current contract total."}
            </p>
          </section>
        )}

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

        {mhicDraft && (
          <section className="mt-8 border border-amber-400 bg-amber-50 p-4 text-sm leading-7">
            <h2 className="text-lg font-bold">Required Contract Dates</h2>
            <p className="mt-3"><strong>Approximate work start date:</strong> {project.proposal_mhic_start_date ? formatWashingtonDate(project.proposal_mhic_start_date) : "Not entered"}</p>
            <p><strong>Approximate substantial completion date:</strong> {project.proposal_mhic_completion_date ? formatWashingtonDate(project.proposal_mhic_completion_date) : "Not entered"}</p>
          </section>
        )}

        <ProposalSection
          title="Clarifications"
          content={project.proposal_clarifications}
        />

        <ProposalSection
          title="Terms and Conditions"
          content={
            project.proposal_terms_and_conditions ||
            DEFAULT_PROPOSAL_TERMS_AND_CONDITIONS
          }
        />

        {mhicDraft && (
          <>
            <ProposalSection
              title="MHIC Consumer Protection Notice"
              content={MHIC_COMMISSION_NOTICE}
            />
            <ProposalSection
              title="Financing and Security"
              content={`Finance charge: ${project.proposal_mhic_finance_charge || "None"}\nNumber and amount of payments:\n${project.proposal_mhic_payment_schedule || project.proposal_payment_terms || "Not entered"}\n\nCollateral security: ${project.proposal_mhic_collateral_security || "None"}\n\n${project.proposal_mhic_secured_by_property ? MHIC_SECURITY_PLACEHOLDER : "Payment is not represented as secured by an interest in residential real estate."}`}
            />
            <ProposalSection
              title="Cancellation Review"
              content={project.proposal_mhic_door_to_door_status === "applies" ? `${MHIC_DOOR_TO_DOOR_PLACEHOLDER}\n\nBuyer age 65 or older: ${project.proposal_mhic_buyer_age_65_plus ? "Yes" : "No"}\nCancellation deadline: ${project.proposal_mhic_cancellation_deadline ? formatWashingtonDate(project.proposal_mhic_cancellation_deadline) : "Not entered"}` : `Door-to-door status: ${project.proposal_mhic_door_to_door_status || "Not determined"}`}
            />
            <ProposalSection
              title="Documents Incorporated into This Contract"
              content={project.proposal_mhic_incorporated_documents || "None"}
            />
            <ProposalSection
              title="Warranty Claim Procedure"
              content={project.proposal_mhic_warranty_claim_procedure || "Not entered"}
            />
          </>
        )}

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
            {mhicDraft ? "Contract Acceptance" : "Acceptance of Proposal"}
          </h2>

          <p className="mt-4 text-sm">
            {mhicDraft
              ? "The homeowner and contractor accept this written contract, including the identified incorporated documents. A fully signed copy must be provided to the homeowner before work begins."
              : "The above proposal, pricing, scope, and terms are hereby accepted."}
          </p>

          <div className="mt-8 space-y-5 text-sm">
            {mhicDraft ? (
              <>
                <SignatureLine label="Homeowner printed name" />
                <SignatureLine label="Homeowner signature" />
                <SignatureLine label="Date" />
                <SignatureLine label="Contractor authorized signer" value={MHIC_DRAFT_CONTRACTOR.licenseeName} />
                <SignatureLine label="Contractor signature" />
                <SignatureLine label="Contractor license number" value={MHIC_DRAFT_CONTRACTOR.licenseNumber} />
                <SignatureLine label="Date" />
                <SignatureLine label="Salesperson name / license no." value={`${MHIC_DRAFT_CONTRACTOR.licenseeName} / ${MHIC_DRAFT_CONTRACTOR.licenseNumber}`} />
                <SignatureLine label="Salesperson signature / date" />
              </>
            ) : (
              <>
                <SignatureLine label="Accepted By" />
                <SignatureLine label="Company" />
                <SignatureLine label="Signature" />
                <SignatureLine label="Date" />
                <SignatureLine label="Purchase Order / Authorization No." />
              </>
            )}
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

function SignatureLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <span className="font-medium sm:w-56">{label}:</span>
      <span className="min-h-6 flex-1 border-b border-neutral-500 px-1">{value}</span>
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
