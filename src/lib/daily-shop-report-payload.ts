export type ReportPayload = {
  reportDate?: string;
  generalShopNotes?: string;
  progressBlockers?: string;
  employees?: Array<{
    employeeId?: string;
    noTimeToReport?: boolean;
    sortOrder?: number;
    entries?: Array<{
      projectId?: string | null;
      manualProjectName?: string;
      timeIn?: string;
      timeOut?: string;
      sortOrder?: number;
    }>;
  }>;
};

export function parseReportPayload(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return {};
  try {
    return JSON.parse(value) as ReportPayload;
  } catch {
    return {};
  }
}

export function validateReportPayload(payload: ReportPayload) {
  if (!payload.reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.reportDate)) {
    return "Select a valid report date.";
  }
  if (!payload.employees?.length) return "Add at least one employee.";
  const employeeIds = payload.employees.map((employee) => employee.employeeId);
  if (
    employeeIds.some((id) => !id) ||
    new Set(employeeIds).size !== employeeIds.length
  ) {
    return "Each employee can only appear once in a report.";
  }

  for (const employee of payload.employees) {
    if (employee.noTimeToReport) continue;
    if (!employee.entries?.length) {
      return "Add at least one project per employee.";
    }
    const ranges: Array<[number, number]> = [];
    for (const entry of employee.entries) {
      const hasProject = Boolean(entry.projectId);
      const hasManualProject = Boolean(entry.manualProjectName?.trim());
      if (hasProject === hasManualProject) {
        return "Select a project or enter a manual project name for every row.";
      }
      if (!isTime(entry.timeIn) || !isTime(entry.timeOut)) {
        return "Select valid start and end times.";
      }
      const start = timeToMinutes(entry.timeIn!);
      const end = timeToMinutes(entry.timeOut!);
      if (end <= start) return "End time must be later than start time.";
      if (
        ranges.some(
          ([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart
        )
      ) {
        return "Project time entries for an employee cannot overlap.";
      }
      ranges.push([start, end]);
    }
  }
  return "";
}

export function reportMinutesBetween(start: string, end: string) {
  return timeToMinutes(end) - timeToMinutes(start);
}

function isTime(value?: string) {
  return Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
