"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export default function CalendarMobileEventActions({
  eventId,
  month,
}: {
  eventId: string;
  month: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteEvent() {
    if (!window.confirm("Delete this calendar event permanently?")) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/calendar-events/${encodeURIComponent(eventId)}`,
        { method: "DELETE" }
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Unable to delete the event.");
      }
      router.replace(`/admin/calendar?month=${month}`);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to delete the event."
      );
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 flex gap-3 border-t border-white/10 pt-5">
      <Link
        href={`/admin/calendar?month=${month}&edit=${encodeURIComponent(eventId)}`}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold hover:bg-white/5"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit
      </Link>
      <button
        type="button"
        onClick={deleteEvent}
        disabled={deleting}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
