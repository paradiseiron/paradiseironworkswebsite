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
  getInvoiceLineItems,
  getInvoiceSummary,
  getProjectLocation,
} from "@/lib/invoice";

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

  if (!["active", "completed"].includes(String(project.status || ""))) {
    return new NextResponse("Invoice is not available for this project yet.", {
      status: 409,
    });
  }

  try {
    const origin = new URL(request.url).origin;
    const pdfBuffer = await renderToBuffer(
      <InvoicePdf
        project={project}
        logoUrl={`${origin}/images/paradise_ironworks_logo.png`}
      />
    );
    const summary = getInvoiceSummary(project);
    const filename = safeFilename(summary.invoiceNumber);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (pdfError) {
    console.error("Invoice PDF generation failed:", pdfError);
    return new NextResponse("Unable to generate invoice PDF. Code: render", {
      status: 500,
    });
  }
}

function InvoicePdf({
  project,
  logoUrl,
}: {
  project: Record<string, unknown>;
  logoUrl: string;
}) {
  const value = (key: string) => String(project[key] || "");
  const summary = getInvoiceSummary(project);
  const lineItems = getInvoiceLineItems(summary);
  const projectLocation = getProjectLocation(project);

  return (
    <Document
      title={`Invoice ${summary.invoiceNumber}`}
      author="Paradise Ironworks & Construction LLC"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <View style={styles.headerCopy}>
            <Text style={styles.company}>
              Paradise Ironworks & Construction LLC
            </Text>
            <Text style={styles.title}>Invoice</Text>
            <View style={styles.metaGroup}>
              <Text style={styles.meta}>
                <Text style={styles.inlineLabel}>Invoice #:</Text>{" "}
                {summary.invoiceNumber}
              </Text>
              <Text style={styles.meta}>
                <Text style={styles.inlineLabel}>Date:</Text>{" "}
                {formatWashingtonDate(new Date())}
              </Text>
              <Text style={styles.meta}>
                <Text style={styles.inlineLabel}>Status:</Text>{" "}
                {value("status") || "—"}
              </Text>
            </View>
          </View>
          {/* react-pdf Image does not expose the HTML alt prop. */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoUrl} style={styles.logo} />
        </View>

        <View style={styles.projectGrid} wrap={false}>
          <View style={styles.column}>
            <Label>Bill To</Label>
            <Text style={styles.bodyStrong}>
              {value("contact_name") || value("customer_name") || "—"}
            </Text>
            <Text style={styles.body}>{value("customer_name") || "—"}</Text>
            <Text style={styles.body}>{value("email") || "—"}</Text>
            <Text style={styles.body}>{value("phone") || "—"}</Text>
          </View>
          <View style={styles.column}>
            <Label>Project</Label>
            <Text style={styles.bodyStrong}>
              {value("proposal_project_name") || value("customer_name") || "—"}
            </Text>
            <Label spaced>Project Location</Label>
            <Text style={styles.body}>{projectLocation || "—"}</Text>
          </View>
        </View>

        <View style={styles.section} minPresenceAhead={80}>
          <Text style={styles.sectionTitle}>Invoice Summary</Text>
          <View style={styles.invoiceTable}>
            <View style={[styles.invoiceRow, styles.invoiceHeader]} wrap={false}>
              <Text style={[styles.invoiceCell, styles.invoiceDescription]}>
                Description
              </Text>
              <Text style={[styles.invoiceCell, styles.invoiceAmount]}>
                Amount
              </Text>
            </View>
            {lineItems.map((item) => (
              <View key={item.description} style={styles.invoiceRow} wrap={false}>
                <Text style={[styles.invoiceCell, styles.invoiceDescription]}>
                  {item.description}
                </Text>
                <Text style={[styles.invoiceCell, styles.invoiceAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
            <View style={[styles.invoiceRow, styles.invoiceTotalRow]} wrap={false}>
              <Text style={styles.invoiceTotalLabel}>Total Due</Text>
              <Text style={styles.invoiceTotalValue}>
                {formatCurrency(summary.amountDue)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metrics} wrap={false}>
          <Metric
            label="Contract Amount"
            value={formatCurrency(summary.contractAmount)}
          />
          <Metric
            label="Paid / Credited"
            value={formatCurrency(summary.paidToDate)}
          />
          <Metric label="Balance Due" value={formatCurrency(summary.amountDue)} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.body}>
            Payment is due upon receipt unless otherwise agreed in writing.
            Please reference {summary.invoiceNumber} with payment.
          </Text>
          <Text style={styles.bodyStrong}>
            Paradise Ironworks & Construction LLC
          </Text>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  invoiceTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d4d4d4",
  },
  invoiceRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
  },
  invoiceHeader: {
    borderTopWidth: 0,
    backgroundColor: "#f5f5f5",
    fontFamily: "Helvetica-Bold",
  },
  invoiceCell: {
    paddingTop: 7,
    paddingRight: 8,
    paddingBottom: 7,
    paddingLeft: 8,
    borderRightWidth: 1,
    borderRightColor: "#d4d4d4",
  },
  invoiceDescription: { flexGrow: 1, flexBasis: 0 },
  invoiceAmount: { width: 110, textAlign: "right", borderRightWidth: 0 },
  invoiceTotalRow: {
    borderTopColor: "#737373",
    fontFamily: "Helvetica-Bold",
  },
  invoiceTotalLabel: {
    flexGrow: 1,
    flexBasis: 0,
    paddingTop: 7,
    paddingRight: 8,
    paddingBottom: 7,
    paddingLeft: 8,
    textAlign: "right",
  },
  invoiceTotalValue: {
    width: 110,
    paddingTop: 7,
    paddingRight: 8,
    paddingBottom: 7,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#d4d4d4",
    textAlign: "right",
  },
  metrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  metric: {
    flexBasis: 0,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    padding: 10,
  },
  metricLabel: {
    color: "#737373",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 7,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 30,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
  },
});

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}
