import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalRole } from "@/lib/roles";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("phone")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const phone = project.phone?.trim() || "customer phone number";
  const { error } = await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "call",
    activity_date: new Date().toISOString(),
    summary: `Call initiated to ${phone}.`,
  });

  if (error) {
    console.error("Call activity logging failed:", error);
    return NextResponse.json(
      { error: "Unable to log call activity." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
