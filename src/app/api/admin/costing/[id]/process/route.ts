import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { processCostDocument } from "@/lib/cost-extraction";

export const maxDuration = 120;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser(); const role = await getUserRole(user.id);
  if (role === "viewer" || role === "unassigned") return NextResponse.json({ error: "Write access is required." }, { status: 403 });
  try { return NextResponse.json(await processCostDocument((await params).id)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process document." }, { status: 500 }); }
}
