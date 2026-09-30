/* eslint-disable jsx-a11y/alt-text -- react-pdf Image does not support the HTML alt prop */
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { bidSubmittalStatusLabel } from "@/lib/bid-submittals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; submittalId: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
  const { id, submittalId } = await params;
  const supabase = createAdminClient();
  const [{ data: bid }, { data: submittal }] = await Promise.all([
    supabase.from("bid_opportunities").select("project_name, general_contractor, owner_name, project_address, city, state, zip_code, contact_name, contact_email, contact_phone").eq("id", id).maybeSingle(),
    supabase.from("bid_submittals").select("*").eq("id", submittalId).eq("bid_opportunity_id", id).maybeSingle(),
  ]);
  if (!bid || !submittal) return new NextResponse("Submittal not found", { status: 404 });
  const origin = new URL(request.url).origin;
  const buffer = await renderToBuffer(<CoverSheet bid={bid} submittal={submittal} logo={`${origin}/images/paradise_ironworks_logo.png`} />);
  const number = `S-${String(submittal.submittal_number).padStart(3, "0")}${submittal.revision_number ? `-R${submittal.revision_number}` : ""}`;
  const project = String(bid.project_name || "Project").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return new NextResponse(Buffer.from(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${number}-${project}-Cover-Sheet.pdf"` } });
}

function CoverSheet({ bid, submittal, logo }: { bid: Record<string, string | null>; submittal: Record<string, unknown>; logo: string }) {
  const number = `S-${String(submittal.submittal_number).padStart(3, "0")}`;
  const revision = Number(submittal.revision_number || 0);
  const address = [bid.project_address, bid.city, bid.state, bid.zip_code].filter(Boolean).join(", ");
  return <Document title={`${number} Submittal Cover Sheet`} author="Paradise Ironworks & Construction LLC"><Page size="LETTER" style={s.page}>
    <View style={s.header}><View><Text style={s.company}>PARADISE IRONWORKS &amp; CONSTRUCTION LLC</Text><Text style={s.title}>Submittal Cover Sheet</Text><Text style={s.number}>{number}{revision ? ` · Revision ${revision}` : ""}</Text></View><Image src={logo} style={s.logo} /></View>
    <View style={s.orangeRule} />
    <View style={s.projectGrid}><View style={s.half}><Label>PROJECT</Label><Text style={s.strong}>{bid.project_name || "—"}</Text><Text style={s.body}>{address || "Address not specified"}</Text><Text style={s.body}>Owner: {bid.owner_name || "Not specified"}</Text></View><View style={s.half}><Label>GENERAL CONTRACTOR</Label><Text style={s.strong}>{bid.general_contractor || "—"}</Text><Text style={s.body}>Contact: {bid.contact_name || "Not specified"}</Text><Text style={s.body}>{bid.contact_email || ""}</Text><Text style={s.body}>{bid.contact_phone || ""}</Text></View></View>
    <View style={s.subject}><Label>SUBMITTAL</Label><Text style={s.subjectTitle}>{String(submittal.title || "")}</Text><View style={s.metaRow}><Meta label="Type" value={submittal.submittal_type} /><Meta label="Specification Section" value={submittal.specification_section} /><Meta label="Status" value={bidSubmittalStatusLabel(String(submittal.status || "draft"))} /></View></View>
    <View style={s.infoGrid}><Meta label="Responsible Party" value={submittal.responsible_party} /><Meta label="Submitted To" value={submittal.submitted_to} /><Meta label="Required Date" value={dateValue(submittal.required_date)} /><Meta label="Submitted Date" value={dateValue(submittal.submitted_date)} /><Meta label="Response Due" value={dateValue(submittal.response_due_date)} /><Meta label="Response Received" value={dateValue(submittal.response_date)} /></View>
    <Section title="Description" value={submittal.description} />
    <Section title="Reviewer Comments / Action" value={submittal.reviewer_comments} minHeight={90} />
    <View style={s.approval}><Text style={s.approvalTitle}>REVIEW ACTION</Text><View style={s.checkRow}><Text>□ Approved</Text><Text>□ Approved as Noted</Text><Text>□ Revise and Resubmit</Text><Text>□ Rejected</Text></View><View style={s.signatureRow}><Text style={s.signature}>Reviewed by:</Text><Text style={s.signature}>Date:</Text></View></View>
    <View style={s.footer}><Text>Paradise Ironworks &amp; Construction LLC</Text><Text>Submittal {number}</Text></View>
  </Page></Document>;
}

function Label({ children }: { children: React.ReactNode }) { return <Text style={s.label}>{children}</Text>; }
function Meta({ label, value }: { label: string; value: unknown }) { return <View style={s.meta}><Text style={s.label}>{label.toUpperCase()}</Text><Text style={s.strong}>{value ? String(value) : "—"}</Text></View>; }
function Section({ title, value, minHeight = 60 }: { title: string; value: unknown; minHeight?: number }) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><Text style={[s.body, { minHeight }]}>{value ? String(value) : ""}</Text></View>; }
function dateValue(value: unknown) { if (!value) return "—"; const [year, month, day] = String(value).split("-"); return month && day ? `${month}/${day}/${year}` : String(value); }

const s = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", fontSize: 9, color: "#171717" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, company: { fontSize: 8, color: "#737373", letterSpacing: 1.2 }, title: { fontSize: 24, fontWeight: 700, marginTop: 10 }, number: { fontSize: 10, color: "#525252", marginTop: 7 }, logo: { width: 145, height: 58, objectFit: "contain" }, orangeRule: { height: 3, backgroundColor: "#fb5411", marginTop: 15 },
  projectGrid: { flexDirection: "row", gap: 28, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#d4d4d4" }, half: { width: "50%" }, label: { fontSize: 7.5, fontWeight: 700, color: "#737373", letterSpacing: .6, marginBottom: 5 }, strong: { fontWeight: 700, lineHeight: 1.4 }, body: { lineHeight: 1.5, color: "#404040" },
  subject: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#d4d4d4" }, subjectTitle: { fontSize: 17, fontWeight: 700, marginBottom: 14 }, metaRow: { flexDirection: "row", gap: 18 }, meta: { flex: 1 }, infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0, paddingTop: 17 },
  section: { marginTop: 16, borderWidth: 1, borderColor: "#d4d4d4" }, sectionTitle: { padding: 7, backgroundColor: "#f5f5f5", fontSize: 8, fontWeight: 700, color: "#525252" },
  approval: { marginTop: 16, borderWidth: 1, borderColor: "#d4d4d4", padding: 12 }, approvalTitle: { fontSize: 8, fontWeight: 700, color: "#525252" }, checkRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 }, signatureRow: { flexDirection: "row", gap: 40, marginTop: 22 }, signature: { width: "45%", borderBottomWidth: 1, borderBottomColor: "#737373", paddingBottom: 4, color: "#525252" },
  footer: { position: "absolute", bottom: 28, left: 42, right: 42, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#d4d4d4", paddingTop: 8, color: "#737373", fontSize: 8 },
});
