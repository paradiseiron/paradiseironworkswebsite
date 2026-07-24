import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseReportPayload,
  reportMinutesBetween,
  validateReportPayload,
} from "@/lib/daily-shop-report-payload";

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "operations_foreman");
  const formData = await request.formData();
  const payload = parseReportPayload(formData.get("payload"));
  const validationError = validateReportPayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createAdminClient();
  const employees = payload.employees || [];
  const employeeIds = employees.map((employee) => employee.employeeId as string);
  const projectIds = Array.from(
    new Set(
      employees.flatMap((employee) =>
        (employee.entries || [])
          .map((entry) => entry.projectId)
          .filter((id): id is string => Boolean(id))
      )
    )
  );

  const [{ data: validEmployees }, { data: validProjects }] = await Promise.all([
    supabase
      .from("shop_employees")
      .select("id")
      .in("id", employeeIds)
      .eq("active", true),
    projectIds.length
      ? supabase
          .from("projects")
          .select("id")
          .in("id", projectIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
  ]);

  if ((validEmployees || []).length !== employeeIds.length) {
    return NextResponse.json(
      { error: "Select a valid active employee for every card." },
      { status: 400 }
    );
  }
  if ((validProjects || []).length !== projectIds.length) {
    return NextResponse.json(
      { error: "One or more selected projects are no longer active." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: report, error: reportError } = await supabase
    .from("daily_shop_reports")
    .insert({
      report_date: payload.reportDate,
      status: "draft",
      general_shop_notes: payload.generalShopNotes?.trim() || null,
      progress_blockers: payload.progressBlockers?.trim() || null,
      created_by: user.id,
      updated_at: now,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    const duplicateDate = reportError?.code === "23505";
    return NextResponse.json(
      {
        error: duplicateDate
          ? "A Daily Shop Report already exists for this date."
          : reportError?.message || "Unable to create the report.",
      },
      { status: duplicateDate ? 409 : 500 }
    );
  }

  const uploadedPaths: string[] = [];
  try {
    for (const [employeeIndex, employee] of employees.entries()) {
      const entries = employee.noTimeToReport ? [] : employee.entries || [];
      const totalMinutes = entries.reduce(
        (total, entry) =>
          total + reportMinutesBetween(entry.timeIn!, entry.timeOut!),
        0
      );
      const { data: reportEmployee, error: employeeError } = await supabase
        .from("daily_shop_report_employees")
        .insert({
          report_id: report.id,
          employee_id: employee.employeeId,
          sort_order: employee.sortOrder ?? employeeIndex,
          total_minutes: totalMinutes,
          no_time_to_report: Boolean(employee.noTimeToReport),
        })
        .select("id")
        .single();
      if (employeeError || !reportEmployee) {
        throw new Error(employeeError?.message || "Unable to save an employee.");
      }

      const { error: entriesError } = await supabase
        .from("daily_shop_report_entries")
        .insert(
          entries.map((entry, entryIndex) => ({
            report_employee_id: reportEmployee.id,
            project_id: entry.projectId || null,
            manual_project_name: entry.projectId
              ? null
              : entry.manualProjectName?.trim(),
            time_in: entry.timeIn,
            time_out: entry.timeOut,
            minutes_worked: reportMinutesBetween(entry.timeIn!, entry.timeOut!),
            sort_order: entry.sortOrder ?? entryIndex,
          }))
        );
      if (entriesError) throw new Error(entriesError.message);
    }

    const photos = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);
    for (const photo of photos) {
      if (!photo.type.startsWith("image/")) {
        throw new Error("Only image files can be added to a shop report.");
      }
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${report.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("daily-shop-report-images")
        .upload(path, photo, {
          contentType: photo.type,
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);
      uploadedPaths.push(path);

      const { error: imageError } = await supabase
        .from("daily_shop_report_images")
        .insert({
          report_id: report.id,
          storage_path: path,
          file_name: photo.name,
          content_type: photo.type,
          size_bytes: photo.size,
          uploaded_by: user.id,
        });
      if (imageError) throw new Error(imageError.message);
    }

    const submittedAt = new Date().toISOString();
    const { error: submitError } = await supabase
      .from("daily_shop_reports")
      .update({
        status: "submitted",
        submitted_by: user.id,
        submitted_at: submittedAt,
        updated_at: submittedAt,
      })
      .eq("id", report.id)
      .eq("status", "draft");
    if (submitError) throw new Error(submitError.message);

    return NextResponse.json({ id: report.id });
  } catch (saveError) {
    if (uploadedPaths.length) {
      await supabase.storage.from("daily-shop-report-images").remove(uploadedPaths);
    }
    await supabase.from("daily_shop_reports").delete().eq("id", report.id);
    return NextResponse.json(
      {
        error:
          saveError instanceof Error
            ? saveError.message
            : "Unable to submit the report.",
      },
      { status: 500 }
    );
  }
}
