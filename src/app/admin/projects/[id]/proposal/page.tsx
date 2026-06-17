import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProposalPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}

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

  return (
    <main className="min-h-screen bg-neutral-200 px-6 py-10 text-neutral-950 print:bg-white print:p-0">
     <article className="mx-auto max-w-[850px] bg-white px-14 py-12 shadow-xl print:max-w-none print:shadow-none">


       <header className="border-b border-neutral-300 pb-6">
  <div className="flex items-start justify-between gap-8">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">
        Paradise Ironworks & Construction LLC
      </p>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">
        Proposal
      </h1>

      <div className="mt-4 text-sm text-neutral-600">
        <p>
          <strong>Proposal #:</strong>{" "}
          {project.proposal_number || "Draft"}
        </p>

        <p>
          <strong>Date:</strong>{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>

    <img
      src="/images/paradise_ironworks_logo.png"
      alt="Paradise Ironworks Logo"
      className="h-24 w-auto object-contain"
    />
  </div>
</header>

        <section className="mt-8 grid grid-cols-2 gap-10 text-sm">
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
          title="Pricing"
          content={
            project.proposal_pricing ||
            (project.proposal_amount
              ? `Total Contract Amount: $${Number(
                  project.proposal_amount
                ).toLocaleString()}`
              : "")
          }
        />

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
    <div className="flex gap-3">
      <span className="w-56 font-medium">{label}:</span>
      <span className="flex-1 border-b border-neutral-500" />
    </div>
  );
}

function defaultPaymentTerms(deposit?: number | null) {
  if (deposit) {
    return `Deposit Due Upon Acceptance: $${Number(
      deposit
    ).toLocaleString()}\nRemaining Balance Due Upon Completion`;
  }

  return "Deposit due upon acceptance.\nRemaining balance due upon completion.";
}