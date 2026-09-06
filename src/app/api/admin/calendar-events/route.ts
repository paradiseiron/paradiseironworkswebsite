import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseCalendarEventPayload,
  validateCalendarEventPayload,
} from "@/lib/calendar-events";

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
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
    .insert({
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
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Unable to create the calendar event." },
      { status: 500 }
    );
  }
  if (payload.employeeIds.length) {
    const { error: employeeError } = await supabase
      .from("calendar_event_employees")
      .insert(
        payload.employeeIds.map((employeeId) => ({
          event_id: data.id,
          employee_id: employeeId,
        }))
      );
    if (employeeError) {
      await supabase.from("calendar_events").delete().eq("id", data.id);
      return NextResponse.json(
        { error: "Unable to save the selected employees." },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ id: data.id });
}
