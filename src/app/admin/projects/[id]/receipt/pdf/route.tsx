/* eslint-disable jsx-a11y/alt-text */
import { NextResponse } from "next/server";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { formatWashingtonDate } from "@/lib/date-time";
import { formatCurrency, getInvoiceNumber, getProjectLocation } from "@/lib/invoice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !project) return new NextResponse("Project not found", { status: 404 });
  if (project.status !== "completed") return new NextResponse("Final receipts are available only after the project is completed.", { status: 409 });

  try {
    const receiptNumber = getInvoiceNumber(project).replace(/^INV-/, "REC-");
    const buffer = await renderToBuffer(<ReceiptPdf project={project} logoUrl={`${new URL(request.url).origin}/images/paradise_ironworks_logo.png`} receiptNumber={receiptNumber} />);
    return new NextResponse(Buffer.from(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Receipt PDF generation failed:", error);
    return new NextResponse("Unable to generate receipt PDF.", { status: 500 });
  }
}

function ReceiptPdf({ project, logoUrl, receiptNumber }: { project: Record<string, unknown>; logoUrl: string; receiptNumber: string }) {
  const amount = Number(project.proposal_amount || 0);
  const value = (key: string) => String(project[key] || "");
  return <Document title={`Final Receipt ${receiptNumber}`} author="Paradise Ironworks & Construction LLC"><Page size="LETTER" style={styles.page}><View style={styles.header}><View><Text style={styles.company}>PARADISE IRONWORKS &amp; CONSTRUCTION LLC</Text><Text style={styles.title}>Final Receipt</Text><Text style={styles.meta}>Receipt #: {receiptNumber}</Text><Text style={styles.meta}>Date: {formatWashingtonDate(new Date())}</Text><Text style={styles.paid}>PAID IN FULL</Text></View><Image src={logoUrl} style={styles.logo} /></View><View style={styles.columns}><View style={styles.column}><Text style={styles.label}>RECEIVED FROM</Text><Text style={styles.strong}>{value("contact_name") || value("customer_name") || "—"}</Text><Text>{value("email") || "—"}</Text><Text>{value("phone") || "—"}</Text></View><View style={styles.column}><Text style={styles.label}>PROJECT</Text><Text style={styles.strong}>{value("proposal_project_name") || value("project_type") || value("customer_name") || "—"}</Text><Text>{getProjectLocation(project) || "—"}</Text></View></View><View style={styles.table}><View style={styles.row}><Text style={styles.description}>Final payment received for completed project</Text><Text style={styles.amount}>{formatCurrency(amount)}</Text></View><View style={styles.totalRow}><Text style={styles.totalLabel}>Balance Due</Text><Text style={styles.total}>{formatCurrency(0)}</Text></View></View><Text style={styles.thanks}>Thank you for choosing Paradise Ironworks &amp; Construction LLC. This receipt acknowledges payment in full for the project shown above.</Text></Page></Document>;
}

const styles = StyleSheet.create({ page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#171717" }, header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#d4d4d4", paddingBottom: 22 }, company: { fontSize: 9, color: "#737373", letterSpacing: 1.5 }, title: { fontSize: 30, fontWeight: 700, marginTop: 18, marginBottom: 10 }, meta: { color: "#525252", marginTop: 3 }, paid: { color: "#15803d", fontWeight: 700, marginTop: 6 }, logo: { width: 150, height: 75, objectFit: "contain" }, columns: { flexDirection: "row", gap: 40, marginTop: 30 }, column: { flex: 1, lineHeight: 1.5 }, label: { color: "#737373", fontWeight: 700, marginBottom: 7 }, strong: { fontWeight: 700, marginBottom: 3 }, table: { borderWidth: 1, borderColor: "#d4d4d4", marginTop: 34 }, row: { flexDirection: "row" }, description: { flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: "#d4d4d4" }, amount: { width: 120, padding: 12, textAlign: "right" }, totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: "#737373", backgroundColor: "#fafafa" }, totalLabel: { flex: 1, padding: 12, textAlign: "right", fontWeight: 700 }, total: { width: 120, padding: 12, borderLeftWidth: 1, borderLeftColor: "#d4d4d4", textAlign: "right", fontWeight: 700 }, thanks: { marginTop: 28, color: "#525252", lineHeight: 1.5 } });
