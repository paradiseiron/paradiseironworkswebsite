import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { BID_SUBMITTAL_TYPES } from "@/lib/bid-submittals";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") return NextResponse.json({ error: "This action requires write access." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Enter a submittal title." }, { status: 400 });
  const submittalType = BID_SUBMITTAL_TYPES.includes(body.submittalType) ? body.submittalType : "Other";
  const supabase = createAdminClient();
  const { data: bid } = await supabase.from("bid_opportunities").select("status").eq("id", id).maybeSingle();
  if (bid?.status !== "won") return NextResponse.json({ error: "Submittals are available only for won bids." }, { status: 400 });
  const { data: last } = await supabase.from("bid_submittals").select("submittal_number").eq("bid_opportunity_id", id).order("submittal_number", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("bid_submittals").insert({ bid_opportunity_id: id, submittal_number: (last?.submittal_number || 0) + 1, title, submittal_type: submittalType, created_by: user.id }).select("*").single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Unable to create submittal." }, { status: 500 });
  return NextResponse.json({ submittal: data });
}
