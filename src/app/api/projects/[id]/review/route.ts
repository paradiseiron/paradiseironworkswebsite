import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/roles";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((await getUserRole(user.id)) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ website_lead_reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("lead_source", "Website")
    .is("website_lead_reviewed_at", null);

  if (error) {
    console.error("Unable to mark website lead reviewed:", error);
    return NextResponse.json(
      { error: "Unable to mark lead reviewed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
