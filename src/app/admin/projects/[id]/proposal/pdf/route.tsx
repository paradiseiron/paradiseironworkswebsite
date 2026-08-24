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
import { requireAssignedRole } from "@/lib/roles";
import { formatWashingtonDate } from "@/lib/date-time";
import {
  formatCurrency,
  normalizeProposalPricingItems,
  proposalPricingTotal,
  type ProposalPricingLineItem,
} from "@/lib/proposal-pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_PROPOSAL_TERMS_AND_CONDITIONS } from "@/lib/proposal-terms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
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

    await recordFirstProposalDownload(project);

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

async function recordFirstProposalDownload(project: Record<string, unknown>) {
  const supabase = createAdminClient();
  const downloadedAt = new Date().toISOString();
  const shouldPromote =
    project.status === "lead" && Number(project.proposal_amount || 0) > 0;
  const update: Record<string, string> = {
    proposal_first_downloaded_at: downloadedAt,
    updated_at: downloadedAt,
  };

  if (shouldPromote) {
    update.status = "quoted";
    update.proposal_sent_at = downloadedAt;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", String(project.id))
    .is("proposal_first_downloaded_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const proposalNumber = String(project.proposal_number || "").trim();
  const summary = shouldPromote
    ? `${proposalNumber ? `Proposal ${proposalNumber}` : "Proposal"} downloaded for the first time. Project moved to quoted.`
    : `${proposalNumber ? `Proposal ${proposalNumber}` : "Proposal"} downloaded for the first time.`;

  const { error: activityError } = await supabase
    .from("project_activities")
    .insert({
      project_id: String(project.id),
      activity_type: "proposal_sent",
      summary,
    });

  if (activityError) {
    console.error(
      "Unable to record first proposal download activity:",
      activityError
    );
  }
}

export function ProposalPdf({
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
  const deposit = Number(project.proposal_deposit_amount || 0);
  const pricingItems = normalizeProposalPricingItems(
    project.proposal_pricing_items,
    project.proposal_amount,
    project.proposal_pricing
  ).filter(
    (item) => item.description || item.amount !== null || item.price !== null
  );
  const pricingTotal = proposalPricingTotal(pricingItems);

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
            <View style={styles.metaGroup}>
              <Text style={styles.meta}>
                <Text style={styles.inlineLabel}>Proposal #:</Text>{" "}
                {value("proposal_number") || "Draft"}
              </Text>
              <Text style={styles.meta}>
                <Text style={styles.inlineLabel}>Date:</Text>{" "}
                {formatWashingtonDate(new Date())}
              </Text>
            </View>
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
              <Text style={styles.contactLine}>
                <Text style={styles.inlineLabel}>Office:</Text>{" "}
                {value("proposal_office_phone") || "—"}
              </Text>
              <Text style={styles.contactLine}>
                <Text style={styles.inlineLabel}>Cell:</Text>{" "}
                {value("proposal_cell_phone") || value("phone") || "—"}
              </Text>
              <Text style={styles.contactLine}>
                <Text style={styles.inlineLabel}>Email:</Text>{" "}
                {value("proposal_email") || value("email") || "—"}
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
          title="Customer Responsibilities"
          content={value("proposal_customer_responsibilities")}
        />
        <PdfPricingSection items={pricingItems} total={pricingTotal} />
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
        <PdfSection
          title="Terms and Conditions"
          content={
            value("proposal_terms_and_conditions") ||
            DEFAULT_PROPOSAL_TERMS_AND_CONDITIONS
          }
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
      <PdfContent content={content} />
    </View>
  );
}

function PdfPricingSection({
  items,
  total,
}: {
  items: ProposalPricingLineItem[];
  total: number;
}) {
  if (!items.length) return null;

  return (
    <View style={styles.section} minPresenceAhead={70}>
      <Text style={styles.sectionTitle}>Pricing</Text>
      <View style={styles.pricingTable}>
        <View style={[styles.pricingRow, styles.pricingHeader]} wrap={false}>
          <Text style={[styles.pricingCell, styles.pricingDescription]}>
            Description
          </Text>
          <Text style={[styles.pricingCell, styles.pricingAmount]}>Amount</Text>
          <Text style={[styles.pricingCell, styles.pricingPrice]}>Price</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.pricingRow} wrap={false}>
            <Text style={[styles.pricingCell, styles.pricingDescription]}>
              {item.description || "—"}
            </Text>
            <Text style={[styles.pricingCell, styles.pricingAmount]}>
              {formatAmount(item.amount)}
            </Text>
            <Text style={[styles.pricingCell, styles.pricingPrice]}>
              {item.price === null ? "—" : formatCurrency(item.price)}
            </Text>
          </View>
        ))}
        <View style={[styles.pricingRow, styles.pricingTotalRow]} wrap={false}>
          <Text style={styles.pricingTotalLabel}>Total</Text>
          <Text style={styles.pricingTotalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
}

function PdfContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const hasBullets = lines.some((line) => /^\s*[●•]\s*/.test(line));

  if (!hasBullets) {
    return <Text style={styles.sectionBody}>{content}</Text>;
  }

  return (
    <View style={styles.list}>
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^\s*[●•]\s*(.*)$/);

        if (bulletMatch) {
          return (
            <View key={index} style={styles.listItem} wrap={false}>
              <View style={styles.bullet} />
              <Text style={styles.listItemText}>{bulletMatch[1]}</Text>
            </View>
          );
        }

        if (!line.trim()) {
          return <View key={index} style={styles.blankLine} />;
        }

        return (
          <Text key={index} style={styles.listContinuation}>
            {line}
          </Text>
        );
      })}
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
    lineHeight: 1.25,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 18,
    fontSize: 28,
    lineHeight: 1.1,
    fontFamily: "Helvetica-Bold",
  },
  metaGroup: { marginTop: 12 },
  meta: { color: "#525252", fontSize: 9.5, lineHeight: 1.55 },
  inlineLabel: { fontFamily: "Helvetica-Bold" },
  logo: { width: 72, height: 72, objectFit: "contain" },
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
  contactLine: { marginTop: 3 },
  intro: { marginTop: 22, lineHeight: 1.65 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  sectionBody: { marginTop: 7, lineHeight: 1.65 },
  pricingTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d4d4d4",
  },
  pricingRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
  },
  pricingHeader: {
    borderTopWidth: 0,
    backgroundColor: "#f5f5f5",
    fontFamily: "Helvetica-Bold",
  },
  pricingCell: {
    paddingTop: 6,
    paddingRight: 7,
    paddingBottom: 6,
    paddingLeft: 7,
    borderRightWidth: 1,
    borderRightColor: "#d4d4d4",
  },
  pricingDescription: { flexGrow: 1, flexBasis: 0 },
  pricingAmount: { width: 70, textAlign: "right" },
  pricingPrice: { width: 94, textAlign: "right", borderRightWidth: 0 },
  pricingTotalRow: {
    borderTopColor: "#737373",
    fontFamily: "Helvetica-Bold",
  },
  pricingTotalLabel: {
    flexGrow: 1,
    flexBasis: 0,
    paddingTop: 6,
    paddingRight: 7,
    paddingBottom: 6,
    paddingLeft: 7,
    textAlign: "right",
  },
  pricingTotalValue: {
    width: 94,
    paddingTop: 6,
    paddingRight: 7,
    paddingBottom: 6,
    paddingLeft: 7,
    borderLeftWidth: 1,
    borderLeftColor: "#d4d4d4",
    textAlign: "right",
  },
  list: { marginTop: 7 },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    width: 7,
    height: 7,
    marginTop: 5,
    marginRight: 4,
    borderRadius: 3.5,
    backgroundColor: "#171717",
  },
  listItemText: { flexGrow: 1, flexBasis: 0, lineHeight: 1.65 },
  listContinuation: { lineHeight: 1.65 },
  blankLine: { height: 16.5 },
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
  signatureLabel: { width: 172 },
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

function formatAmount(value: number | null) {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : String(value);
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}
