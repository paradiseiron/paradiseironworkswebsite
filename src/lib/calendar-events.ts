export type CalendarEventPayload = {
  eventType?: unknown;
  eventDate?: unknown;
  windowStart?: unknown;
  windowEnd?: unknown;
  projectId?: unknown;
  bidWorkItemId?: unknown;
  manualProjectName?: unknown;
  notes?: unknown;
  employeeIds?: unknown;
};

export function parseCalendarEventPayload(body: CalendarEventPayload) {
  return {
    eventType: typeof body.eventType === "string" ? body.eventType.trim() : "",
    eventDate: typeof body.eventDate === "string" ? body.eventDate.trim() : "",
    windowStart:
      typeof body.windowStart === "string" ? body.windowStart.trim() : "",
    windowEnd: typeof body.windowEnd === "string" ? body.windowEnd.trim() : "",
    projectId: typeof body.projectId === "string" ? body.projectId.trim() : "",
    bidWorkItemId:
      typeof body.bidWorkItemId === "string" ? body.bidWorkItemId.trim() : "",
    manualProjectName:
      typeof body.manualProjectName === "string"
        ? body.manualProjectName.trim()
        : "",
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
    employeeIds: Array.isArray(body.employeeIds)
      ? Array.from(
          new Set(
            body.employeeIds.filter(
              (employeeId): employeeId is string =>
                typeof employeeId === "string" && Boolean(employeeId.trim())
            )
          )
        )
      : [],
  };
}

export function validateCalendarEventPayload(
  payload: ReturnType<typeof parseCalendarEventPayload>
) {
  if (!["fabrication", "delivery", "installation"].includes(payload.eventType)) {
    return "Select fabrication, delivery, or installation.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.eventDate)) {
    return "Select a valid event date.";
  }
  const projectChoices = [payload.projectId, payload.bidWorkItemId, payload.manualProjectName].filter(Boolean).length;
  if (projectChoices !== 1) {
    return "Choose one active project, bid work item, or manual project name.";
  }
  if (payload.manualProjectName.length > 150) {
    return "The manual project name must be 150 characters or fewer.";
  }
  if (Boolean(payload.windowStart) !== Boolean(payload.windowEnd)) {
    return "Choose both a start and end time, or leave both blank.";
  }
  if (
    payload.windowStart &&
    (!/^\d{2}:\d{2}$/.test(payload.windowStart) ||
      !/^\d{2}:\d{2}$/.test(payload.windowEnd) ||
      payload.windowEnd <= payload.windowStart)
  ) {
    return "The event end time must be later than its start time.";
  }
  if (payload.notes.length > 2000) {
    return "Event notes must be 2,000 characters or fewer.";
  }
  if (!payload.employeeIds.length) {
    return "Select at least one employee.";
  }
  if (payload.employeeIds.length > 50) {
    return "Too many employees were selected.";
  }
  return null;
}
