import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/roles";

type ProjectUpdateBody = {
  customer_name?: unknown;
  contact_name?: unknown;
  phone?: unknown;
  email?: unknown;
  project_address?: unknown;
  city?: unknown;
  state?: unknown;
  zip_code?: unknown;
  project_category?: unknown;
  project_type?: unknown;
  lead_source?: unknown;
  priority?: unknown;
  assigned_to?: unknown;
  notes?: unknown;
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function PATCH(
  request: Request,
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
  const body = (await request.json()) as ProjectUpdateBody;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({
      customer_name: stringValue(body.customer_name),
      contact_name: stringValue(body.contact_name),
      phone: stringValue(body.phone),
      email: stringValue(body.email),
      project_address: stringValue(body.project_address),
      city: stringValue(body.city),
      state: stringValue(body.state),
      zip_code: stringValue(body.zip_code),
      project_category: stringValue(body.project_category),
      project_type: stringValue(body.project_type),
      lead_source: stringValue(body.lead_source),
      priority: stringValue(body.priority, "normal"),
      assigned_to: stringValue(body.assigned_to),
      notes: stringValue(body.notes),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Project update failed:", error);
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { data: deletedProjects, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Project deletion failed:", error);
    return NextResponse.json(
      { error: "Unable to delete project." },
      { status: 500 }
    );
  }

  if (!deletedProjects?.length) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  revalidatePath("/admin/projects");

  return NextResponse.json({ ok: true });
}
