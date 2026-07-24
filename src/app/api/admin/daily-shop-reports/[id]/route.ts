import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseReportPayload,
  reportMinutesBetween,
  validateReportPayload,
} from "@/lib/daily-shop-report-payload";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  if ((await getUserRole(user.id)) !== "operations_foreman") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const payload = parseReportPayload(formData.get("payload"));
  const validationError = validateReportPayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: report } = await supabase
    .from("daily_shop_reports")
    .select("id, created_by, status")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (report.status !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted reports can be edited here." },
      { status: 409 }
    );
  }

  const employees = payload.employees || [];
  const employeeIds = employees.map((employee) => employee.employeeId as string);
  const projectIds = Array.from(
    new Set(
      employees.flatMap((employee) =>
        (employee.entries || [])
          .map((entry) => entry.projectId)
          .filter((projectId): projectId is string => Boolean(projectId))
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
      ? supabase.from("projects").select("id").in("id", projectIds)
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
      { error: "One or more selected projects no longer exist." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("daily_shop_reports")
    .update({
      report_date: payload.reportDate,
      general_shop_notes: payload.generalShopNotes?.trim() || null,
      progress_blockers: payload.progressBlockers?.trim() || null,
      updated_at: now,
    })
    .eq("id", id);
  if (updateError) {
    const duplicateDate = updateError.code === "23505";
    return NextResponse.json(
      {
        error: duplicateDate
          ? "A Daily Shop Report already exists for this date."
          : updateError.message,
      },
      { status: duplicateDate ? 409 : 500 }
    );
  }

  const { error: clearError } = await supabase
    .from("daily_shop_report_employees")
    .delete()
    .eq("report_id", id);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

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
        report_id: id,
        employee_id: employee.employeeId,
        sort_order: employee.sortOrder ?? employeeIndex,
        total_minutes: totalMinutes,
        no_time_to_report: Boolean(employee.noTimeToReport),
      })
      .select("id")
      .single();
    if (employeeError || !reportEmployee) {
      return NextResponse.json(
        { error: employeeError?.message || "Unable to update an employee." },
        { status: 500 }
      );
    }

    if (entries.length) {
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
            minutes_worked: reportMinutesBetween(
              entry.timeIn!,
              entry.timeOut!
            ),
            sort_order: entry.sortOrder ?? entryIndex,
          }))
        );
      if (entriesError) {
        return NextResponse.json(
          { error: entriesError.message },
          { status: 500 }
        );
      }
    }
  }

  const uploadedPaths: string[] = [];
  try {
    const photos = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);
    for (const photo of photos) {
      if (!photo.type.startsWith("image/")) {
        throw new Error("Only image files can be added to a shop report.");
      }
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("daily-shop-report-images")
        .upload(path, photo, {
          contentType: photo.type,
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);

      const { error: imageError } = await supabase
        .from("daily_shop_report_images")
        .insert({
          report_id: id,
          storage_path: path,
          file_name: photo.name,
          content_type: photo.type,
          size_bytes: photo.size,
          uploaded_by: user.id,
        });
      if (imageError) throw imageError;
    }
  } catch (photoError) {
    if (uploadedPaths.length) {
      await supabase.storage
        .from("daily-shop-report-images")
        .remove(uploadedPaths);
      await supabase
        .from("daily_shop_report_images")
        .delete()
        .in("storage_path", uploadedPaths);
    }
    return NextResponse.json(
      {
        error:
          photoError instanceof Error
            ? photoError.message
            : "Unable to add report photos.",
      },
      { status: 500 }
    );
  }

  revalidatePath(`/admin/daily-shop-report/${id}`);
  revalidatePath("/admin/daily-shop-report");
  return NextResponse.json({ id });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthenticatedUser();
  if ((await getUserRole(user.id)) !== "operations_foreman") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const supabase = createAdminClient();

  const { data: report } = await supabase
    .from("daily_shop_reports")
    .select("created_by, daily_shop_report_images(storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paths =
    report.daily_shop_report_images
      ?.map((image) => image.storage_path)
      .filter(Boolean) || [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage
      .from("daily-shop-report-images")
      .remove(paths);
    if (storageError) {
      return NextResponse.json(
        { error: "Unable to remove the report's stored photos." },
        { status: 500 }
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("daily_shop_reports")
    .delete()
    .eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/admin/daily-shop-report");
  return NextResponse.json({ ok: true });
}
