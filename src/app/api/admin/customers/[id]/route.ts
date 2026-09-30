import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/roles";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authClient = await createClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (await getUserRole(user.id) !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { data, error } = await createAdminClient().from("customers").delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to delete customer." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
