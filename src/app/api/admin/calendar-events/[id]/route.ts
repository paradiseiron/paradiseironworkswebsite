import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseCalendarEventPayload,
  validateCalendarEventPayload,
} from "@/lib/calendar-events";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const payload = parseCalendarEventPayload(
    await request.json().catch(() => ({}))
  );
  const validationError = validateCalendarEventPayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const supabase = createAdminClient();
  if (payload.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", payload.projectId)
      .eq("status", "active")
      .maybeSingle();
    if (!project) {
      return NextResponse.json(
        { error: "Select a project that is currently active." },
        { status: 400 }
      );
    }
  }
  if (payload.bidWorkItemId) {
    const { data: workItem } = await supabase.from("bid_work_items").select("id, bid_opportunities!inner(status)").eq("id", payload.bidWorkItemId).eq("bid_opportunities.status", "won").maybeSingle();
    if (!workItem) return NextResponse.json({ error: "Select a work item from a won bid." }, { status: 400 });
  }
  if (payload.employeeIds.length) {
    const { data: employees } = await supabase
      .from("shop_employees")
      .select("id")
      .in("id", payload.employeeIds)
      .eq("active", true);
    if ((employees || []).length !== payload.employeeIds.length) {
      return NextResponse.json(
        { error: "One or more selected employees are no longer active." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .update({
      event_type: payload.eventType,
      event_date: payload.eventDate,
      window_start: payload.windowStart || null,
      window_end: payload.windowEnd || null,
      project_id: payload.projectId || null,
      bid_work_item_id: payload.bidWorkItemId || null,
      manual_project_name: payload.projectId || payload.bidWorkItemId
        ? null
        : payload.manualProjectName,
      notes: payload.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }
  const { error: clearEmployeesError } = await supabase
    .from("calendar_event_employees")
    .delete()
    .eq("event_id", id);
  if (clearEmployeesError) {
    return NextResponse.json(
      { error: "Unable to update the selected employees." },
      { status: 500 }
    );
  }
  if (payload.employeeIds.length) {
    const { error: employeeError } = await supabase
      .from("calendar_event_employees")
      .insert(
        payload.employeeIds.map((employeeId) => ({
          event_id: id,
          employee_id: employeeId,
        }))
      );
    if (employeeError) {
      return NextResponse.json(
        { error: "Unable to update the selected employees." },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from("calendar_events")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
