import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({
      customer_name: body.customer_name || "",
      contact_name: body.contact_name || "",
      phone: body.phone || "",
      email: body.email || "",
      project_address: body.project_address || "",
      city: body.city || "",
      state: body.state || "",
      zip_code: body.zip_code || "",
      project_category: body.project_category || "",
      project_type: body.project_type || "",
      lead_source: body.lead_source || "",
      priority: body.priority || "normal",
      assigned_to: body.assigned_to || "",
      notes: body.notes || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}