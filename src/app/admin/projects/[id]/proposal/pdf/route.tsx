import { NextResponse } from "next/server";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAuthenticatedUser();
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    return new NextResponse("Project not found", { status: 404 });
  }

  try {
    const origin = new URL(request.url).origin;
    const pdfBuffer = await renderToBuffer(
      <ProposalPdf
        project={project}
        logoUrl={`${origin}/images/paradise_ironworks_logo.png`}
      />
    );
    const filename = safeFilename(project.proposal_number || "proposal");

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (pdfError) {
    console.error("Proposal PDF generation failed:", pdfError);
    return new NextResponse("Unable to generate proposal PDF. Code: render", {
      status: 500,
    });
  }
}

function ProposalPdf({
  project,
  logoUrl,
}: {
  project: Record<string, unknown>;
  logoUrl: string;
}) {
  const value = (key: string) => String(project[key] || "");
  const projectLocation = [
    value("project_address"),
    value("city"),
    value("state"),
    value("zip_code"),
  ]
    .filter(Boolean)
    .join(", ");
  const amount = Number(project.proposal_amount || 0);
  const deposit = Number(project.proposal_deposit_amount || 0);

  return (
    <Document
      title={`Proposal ${value("proposal_number") || "Draft"}`}
      author="Paradise Ironworks & Construction LLC"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <View style={styles.headerCopy}>
            <Text style={styles.company}>
              Paradise Ironworks & Construction LLC
            </Text>
            <Text style={styles.title}>Proposal</Text>
            <Text style={styles.meta}>
              Proposal #: {value("proposal_number") || "Draft"}
            </Text>
            <Text style={styles.meta}>
              Date: {new Date().toLocaleDateString()}
            </Text>
          </View>
          {/* react-pdf Image does not expose the HTML alt prop. */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoUrl} style={styles.logo} />
        </View>

        <View style={styles.projectGrid} wrap={false}>
          <View style={styles.column}>
            <Label>Project</Label>
            <Text style={styles.bodyStrong}>
              {value("proposal_project_name") || value("customer_name")}
            </Text>
            <Label spaced>Project Location</Label>
            <Text style={styles.body}>{projectLocation || "—"}</Text>
          </View>
          <View style={styles.column}>
            <Label>Attention</Label>
            <Text style={styles.body}>
              {value("proposal_attention") || value("contact_name") || "—"}
            </Text>
            <View style={styles.contact}>
              <Text style={styles.body}>
                Office: {value("proposal_office_phone") || "—"}
              </Text>
              <Text style={styles.body}>
                Cell: {value("proposal_cell_phone") || value("phone") || "—"}
              </Text>
              <Text style={styles.body}>
                Email: {value("proposal_email") || value("email") || "—"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.intro}>
          {value("proposal_intro") ||
            "Paradise Ironworks & Construction LLC (PIWC) is pleased to provide the following proposal for the above referenced project."}
        </Text>

        <PdfSection title="Scope of Work" content={value("proposal_scope")} />
        <PdfSection title="Finish" content={value("proposal_finish")} />
        <PdfSection title="Exclusions" content={value("proposal_exclusions")} />
        <PdfSection
          title="Pricing"
          content={
            value("proposal_pricing") ||
            (amount
              ? `Total Contract Amount: $${amount.toLocaleString()}`
              : "")
          }
        />
        <PdfSection
          title="Payment Terms"
          content={
            value("proposal_payment_terms") || defaultPaymentTerms(deposit)
          }
        />
        <PdfSection title="Schedule" content={value("proposal_schedule")} />
        <PdfSection
          title="Clarifications"
          content={value("proposal_clarifications")}
        />

        <View style={styles.closing}>
          <Text style={styles.body}>
            We appreciate the opportunity to provide this proposal and look
            forward to working with you on this project.
          </Text>
          <Text style={styles.submitted}>Respectfully Submitted,</Text>
          <Text style={styles.bodyStrong}>
            Paradise Ironworks & Construction LLC
          </Text>
          <Text style={styles.preparedBy}>
            {value("proposal_prepared_by") || "Ronald Brown"}
          </Text>
          <Text style={styles.body}>
            {value("proposal_prepared_by_title") ||
              "Operations & Estimating Director"}
          </Text>
        </View>

        <View style={styles.acceptance} wrap={false}>
          <Text style={styles.acceptanceTitle}>Acceptance of Proposal</Text>
          <Text style={styles.acceptanceCopy}>
            The above proposal, pricing, scope, and terms are hereby accepted.
          </Text>
          <SignatureLine label="Accepted By" />
          <SignatureLine label="Company" />
          <SignatureLine label="Signature" />
          <SignatureLine label="Date" />
          <SignatureLine label="Purchase Order / Authorization No." />
        </View>

      </Page>
    </Document>
  );
}

function Label({
  children,
  spaced = false,
}: {
  children: React.ReactNode;
  spaced?: boolean;
}) {
  return (
    <Text style={[styles.label, spaced ? styles.labelSpaced : {}]}>
      {children}
    </Text>
  );
}

function PdfSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  if (!content) return null;

  return (
    <View style={styles.section} minPresenceAhead={42}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{content}</Text>
    </View>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <View style={styles.signatureLine} wrap={false}>
      <Text style={styles.signatureLabel}>{label}:</Text>
      <View style={styles.signatureRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 42,
    paddingBottom: 50,
    paddingLeft: 42,
    color: "#171717",
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.55,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
  },
  headerCopy: { flexGrow: 1 },
  company: {
    color: "#737373",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
  },
  meta: { color: "#525252", fontSize: 9.5, marginTop: 2 },
  logo: { width: 80, height: 80, objectFit: "contain" },
  projectGrid: {
    flexDirection: "row",
    gap: 34,
    marginTop: 22,
  },
  column: { flexBasis: 0, flexGrow: 1 },
  label: {
    color: "#737373",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  labelSpaced: { marginTop: 14 },
  body: { marginTop: 5 },
  bodyStrong: { marginTop: 5, fontFamily: "Helvetica-Bold" },
  contact: { marginTop: 14 },
  intro: { marginTop: 22, lineHeight: 1.65 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  sectionBody: { marginTop: 7, lineHeight: 1.65 },
  closing: { marginTop: 30 },
  submitted: { marginTop: 18 },
  preparedBy: { marginTop: 12 },
  acceptance: {
    marginTop: 36,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
  },
  acceptanceTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  acceptanceCopy: { marginTop: 10, marginBottom: 10 },
  signatureLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 14,
  },
  signatureLabel: { width: 172, fontFamily: "Helvetica-Bold" },
  signatureRule: {
    flexGrow: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#737373",
  },
});

function defaultPaymentTerms(deposit: number) {
  if (deposit) {
    return `Deposit Due Upon Acceptance: $${deposit.toLocaleString()}\nRemaining Balance Due Upon Completion`;
  }

  return "Deposit due upon acceptance.\nRemaining balance due upon completion.";
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}
