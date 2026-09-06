/* eslint-disable jsx-a11y/alt-text -- react-pdf Image does not support the HTML alt prop */
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; rfiId: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireAssignedRole(user.id);
  const { id, rfiId } = await params;
  const supabase = createAdminClient();
  const [{ data: bid }, { data: rfi }] = await Promise.all([
    supabase.from("bid_opportunities").select("project_name, general_contractor, owner_name").eq("id", id).maybeSingle(),
    supabase.from("bid_rfis").select("*").eq("id", rfiId).eq("bid_opportunity_id", id).maybeSingle(),
  ]);
  if (!bid || !rfi) return new NextResponse("RFI not found", { status: 404 });
  const origin = new URL(request.url).origin;
  const buffer = await renderToBuffer(<RfiPdf bid={bid} rfi={rfi} logo={`${origin}/images/paradise_ironworks_logo.png`} />);
  return new NextResponse(Buffer.from(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="RFI-${rfi.rfi_number}-${bid.project_name.replace(/[^a-z0-9]+/gi, "-")}.pdf"` } });
}

function RfiPdf({ bid, rfi, logo }: { bid: Record<string, string | null>; rfi: Record<string, unknown>; logo: string }) {
  const section = (title: string, value: unknown) => value ? <View style={s.section}><Text style={s.heading}>{title}</Text><Text style={s.body}>{String(value)}</Text></View> : null;
  return <Document><Page size="LETTER" style={s.page}><View style={s.header}><View><Text style={s.company}>PARADISE IRONWORKS &amp; CONSTRUCTION LLC</Text><Text style={s.title}>Request for Information</Text><Text style={s.meta}>RFI No. {String(rfi.rfi_number)}</Text></View><Image src={logo} style={s.logo} /></View><View style={s.grid}><View><Text style={s.label}>PROJECT</Text><Text style={s.strong}>{bid.project_name || ""}</Text><Text>{bid.general_contractor || ""}</Text></View><View><Text style={s.label}>SUBJECT</Text><Text style={s.strong}>{String(rfi.subject || "")}</Text><Text>Requested response: {String(rfi.requested_response_date || "Not specified")}</Text></View></View>{section("Background", rfi.background)}{section("Question", rfi.question)}{section("Drawing References", rfi.drawing_references)}{section("Specification References", rfi.specification_references)}{section("Response", rfi.response_text)}<View style={s.footer}><Text>Paradise Ironworks &amp; Construction LLC</Text></View></Page></Document>;
}

const s = StyleSheet.create({ page: { padding: 42, fontFamily: "Helvetica", fontSize: 9, color: "#171717" }, header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#d4d4d4", paddingBottom: 16 }, company: { fontSize: 8, color: "#737373", letterSpacing: 1.2 }, title: { fontSize: 22, fontWeight: 700, marginTop: 9, marginBottom: 8 }, meta: { fontSize: 9, color: "#525252" }, logo: { width: 140, height: 55, objectFit: "contain" }, grid: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }, label: { fontSize: 8, fontWeight: 700, color: "#737373", marginBottom: 5 }, strong: { fontWeight: 700, marginBottom: 3 }, section: { marginTop: 18 }, heading: { fontSize: 12, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: "#d4d4d4", paddingBottom: 5, marginBottom: 7 }, body: { lineHeight: 1.55, whiteSpace: "pre-wrap" }, footer: { marginTop: 30, borderTopWidth: 1, borderTopColor: "#d4d4d4", paddingTop: 12, color: "#737373" } });
