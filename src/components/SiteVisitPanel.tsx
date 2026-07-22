"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Mic, Pencil, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/roles";

type SiteVisitProject = {
  id: string;
  customer_name?: string | null;
  project_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  site_visit_status?: string | null;
  site_visit_scheduled_date?: string | null;
  site_visit_window_start?: string | null;
  site_visit_window_end?: string | null;
  site_visit_location?: string | null;
  site_visit_admin_notes?: string | null;
  site_visit_scope_observations?: string | null;
  site_visit_notes?: string | null;
  site_visit_exclusion_notes?: string | null;
  site_visit_access_safety_concerns?: string | null;
  site_visit_completed_at?: string | null;
};

type SiteVisitImage = { path: string; url: string };

type ScheduledVisitDraft = {
  date: string;
  windowStart: string;
  windowEnd: string;
  location: string;
  adminNotes: string;
};

type CompletedVisitDraft = {
  scopeObservations: string;
  visitNotes: string;
  exclusionNotes: string;
  accessSafetyConcerns: string;
};

export default function SiteVisitPanel({
  project,
  role,
  images,
  onToast,
}: {
  project: SiteVisitProject;
  role: UserRole;
  images: SiteVisitImage[];
  onToast?: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [completedVisit, setCompletedVisit] =
    useState<CompletedVisitDraft | null>(null);
  const [editingVisit, setEditingVisit] = useState(
    (project.site_visit_status || "not_ready") === "ready"
  );
  const [editingSchedule, setEditingSchedule] = useState(
    (project.site_visit_status || "not_ready") !== "ready"
  );
  const [scheduledVisit, setScheduledVisit] =
    useState<ScheduledVisitDraft | null>(null);
  const defaultLocation = [
    project.project_address,
    project.city,
    project.state,
    project.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
  const status = project.site_visit_status || "not_ready";
  const effectiveStatus = scheduledVisit ? "ready" : status;
  const scheduledDate =
    scheduledVisit?.date || project.site_visit_scheduled_date || "";
  const scheduledWindowStart =
    scheduledVisit?.windowStart || shortTime(project.site_visit_window_start);
  const scheduledWindowEnd =
    scheduledVisit?.windowEnd || shortTime(project.site_visit_window_end);
  const scheduledLocation =
    scheduledVisit?.location || project.site_visit_location || defaultLocation;
  const scheduledAdminNotes =
    scheduledVisit?.adminNotes || project.site_visit_admin_notes || "";

  async function markReady(formData: FormData) {
    setBusy(true);
    setMessage("");

    try {
      const wasAlreadyReady = effectiveStatus === "ready";
      const nextVisit = {
        date: String(formData.get("scheduled_date") || ""),
        windowStart: String(formData.get("window_start") || ""),
        windowEnd: String(formData.get("window_end") || ""),
        location: String(formData.get("location") || ""),
        adminNotes: String(formData.get("admin_notes") || ""),
      };
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/site-visit/ready`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledDate: nextVisit.date,
            windowStart: nextVisit.windowStart,
            windowEnd: nextVisit.windowEnd,
            location: nextVisit.location,
            adminNotes: nextVisit.adminNotes,
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(body?.error || "Unable to schedule site visit.");
        return;
      }

      setScheduledVisit(nextVisit);
      setEditingSchedule(false);
      onToast?.(
        wasAlreadyReady
          ? "Site visit updated and estimator notified."
          : "Site visit scheduled and estimator notified."
      );
      router.refresh();
    } catch (scheduleError) {
      setMessage(
        scheduleError instanceof Error
          ? scheduleError.message
          : "Unable to schedule site visit."
      );
    } finally {
      setBusy(false);
    }
  }

  async function completeVisit(formData: FormData) {
    setBusy(true);
    setMessage("");

    try {
      const nextVisit = {
        scopeObservations: String(formData.get("scope_observations") || ""),
        visitNotes: String(formData.get("visit_notes") || ""),
        exclusionNotes: String(formData.get("exclusion_notes") || ""),
        accessSafetyConcerns: String(
          formData.get("access_safety_concerns") || ""
        ),
      };
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired.");

      const files = [
        ...formData.getAll("photos"),
        ...formData.getAll("camera_photos"),
      ].filter((value): value is File => value instanceof File && value.size > 0);
      const imagePaths = [...images.map((image) => image.path)];

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${project.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage
          .from("site-visit-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        imagePaths.push(path);
      }

      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/site-visit/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...nextVisit,
            imagePaths,
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error || "Unable to complete site visit.");
      }

      setMessage("");
      setCompletedVisit(nextVisit);
      setEditingVisit(false);
      onToast?.(
        project.site_visit_status === "completed"
          ? "Site visit details updated successfully."
          : "Site visit completed and admin notified."
      );
      router.refresh();
    } catch (submitError) {
      setMessage(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete site visit."
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    role === "estimator" &&
    (completedVisit || status === "completed") &&
    !editingVisit
  ) {
    const submittedVisit = completedVisit || {
      scopeObservations: project.site_visit_scope_observations || "",
      visitNotes: project.site_visit_notes || "",
      exclusionNotes: project.site_visit_exclusion_notes || "",
      accessSafetyConcerns:
        project.site_visit_access_safety_concerns || "",
    };

    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Site Visit Completed</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Review the submitted visit details below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setEditingVisit(true);
            }}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit visit
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-100">
            Site visit is complete and ready for proposal drafting.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReadOnlyDetail
              label="Date and time"
              value={
                project.site_visit_scheduled_date
                  ? `${project.site_visit_scheduled_date} · ${shortTime(project.site_visit_window_start)}–${shortTime(project.site_visit_window_end)}`
                  : null
              }
            />
            <ReadOnlyDetail
              label="Location"
              value={project.site_visit_location}
            />
            <ReadOnlyDetail label="Status" value="completed" />
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <ReadOnlyDetail
            label="Site scope observations"
            value={submittedVisit.scopeObservations}
          />
          <ReadOnlyDetail label="Visit notes" value={submittedVisit.visitNotes} />
          <ReadOnlyDetail
            label="Exclusion notes"
            value={submittedVisit.exclusionNotes}
          />
          <ReadOnlyDetail
            label="Access / safety concerns"
            value={submittedVisit.accessSafetyConcerns}
          />
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.path}
                  src={image.url}
                  alt="Site visit"
                  className="aspect-square rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (role === "admin" && status !== "completed") {
    if (effectiveStatus === "ready" && !editingSchedule) {
      return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Site Visit Scheduled</h2>
              <p className="mt-1 text-sm text-neutral-400">
                The estimator has been notified. Review the visit details below.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setEditingSchedule(true);
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit visit
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-[#fb5411]/20 bg-[#fb5411]/10 p-4">
            <p className="text-sm font-semibold text-orange-100">
              Site visit is ready for the estimator.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ReadOnlyDetail
                label="Date and time"
                value={
                  scheduledDate
                    ? `${scheduledDate} · ${scheduledWindowStart}-${scheduledWindowEnd}`
                    : null
                }
              />
              <ReadOnlyDetail
                label="Location"
                value={scheduledLocation}
              />
              <ReadOnlyDetail
                label="Instructions for estimator"
                value={scheduledAdminNotes}
              />
              <ReadOnlyDetail label="Status" value="ready" />
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">
          {effectiveStatus === "ready" ? "Update Site Visit" : "Schedule Site Visit"}
        </h2>
        <p className="mt-1 text-sm text-neutral-400">
          Set the visit window and notify the estimator when the project is
          ready.
        </p>
        <form action={markReady} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <SiteField
              label="Visit date"
              name="scheduled_date"
              type="date"
              required
              defaultValue={scheduledDate}
            />
            <SiteField
              label="Window start"
              name="window_start"
              type="time"
              required
              defaultValue={scheduledWindowStart}
            />
            <SiteField
              label="Window end"
              name="window_end"
              type="time"
              required
              defaultValue={scheduledWindowEnd}
            />
          </div>
          <SiteField
            label="Location"
            name="location"
            required
            defaultValue={scheduledLocation}
          />
          <SiteTextArea
            label="Instructions for estimator"
            name="admin_notes"
            defaultValue={scheduledAdminNotes}
          />
          {message && <p className="text-sm text-amber-200">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Notifying…"
              : effectiveStatus === "ready"
                ? "Update visit and notify estimator"
                : "Mark ready and notify estimator"}
          </button>
        </form>
      </section>
    );
  }

  if (
    role === "estimator" &&
    (status === "ready" || status === "completed") &&
    editingVisit
  ) {
    return (
      <section className="rounded-2xl border border-[#fb5411]/20 bg-white/[0.03] p-4 sm:p-6">
        <VisitSchedule project={project} />
        <form action={completeVisit} className="mt-6 space-y-5">
          <DictationTextArea
            label="Site scope observations"
            name="scope_observations"
            required
            defaultValue={
              completedVisit?.scopeObservations ||
              project.site_visit_scope_observations ||
              ""
            }
          />
          <DictationTextArea
            label="Visit notes"
            name="visit_notes"
            required
            defaultValue={
              completedVisit?.visitNotes || project.site_visit_notes || ""
            }
          />
          <DictationTextArea
            label="Exclusion notes"
            name="exclusion_notes"
            defaultValue={
              completedVisit?.exclusionNotes ||
              project.site_visit_exclusion_notes ||
              ""
            }
          />
          <DictationTextArea
            label="Access / safety concerns"
            name="access_safety_concerns"
            defaultValue={
              completedVisit?.accessSafetyConcerns ||
              project.site_visit_access_safety_concerns ||
              ""
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FileInput
              name="camera_photos"
              label="Take photos"
              icon={<Camera className="h-5 w-5" aria-hidden="true" />}
              capture="environment"
            />
            <FileInput
              name="photos"
              label="Choose annotated photos"
              icon={<ImagePlus className="h-5 w-5" aria-hidden="true" />}
              multiple
            />
          </div>
          <p className="text-xs leading-5 text-neutral-500">
            You can annotate measurements in the iPhone Photos app, then choose
            those edited images here.
          </p>
          {message && !busy && (
            <p className="text-sm text-red-300">{message}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy
              ? "Submitting…"
              : status === "completed"
                ? "Save site visit changes"
                : "Complete site visit"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <VisitSchedule project={project} />
      {status === "not_ready" ? (
        <p className="mt-5 text-sm text-neutral-400">
          This project has not been marked ready for a site visit.
        </p>
      ) : (
        <div className="mt-6 grid gap-5">
          <ReadOnlyDetail
            label="Site scope observations"
            value={project.site_visit_scope_observations}
          />
          <ReadOnlyDetail label="Visit notes" value={project.site_visit_notes} />
          <ReadOnlyDetail
            label="Exclusion notes"
            value={project.site_visit_exclusion_notes}
          />
          <ReadOnlyDetail
            label="Access / safety concerns"
            value={project.site_visit_access_safety_concerns}
          />
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.path}
                  src={image.url}
                  alt="Site visit"
                  className="aspect-square rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function VisitSchedule({ project }: { project: SiteVisitProject }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Site Visit</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReadOnlyDetail
          label="Date and time"
          value={
            project.site_visit_scheduled_date
              ? `${project.site_visit_scheduled_date} · ${shortTime(project.site_visit_window_start)}–${shortTime(project.site_visit_window_end)}`
              : null
          }
        />
        <ReadOnlyDetail
          label="Location"
          value={project.site_visit_location}
        />
        <ReadOnlyDetail
          label="Admin instructions"
          value={project.site_visit_admin_notes}
        />
        <ReadOnlyDetail
          label="Status"
          value={(project.site_visit_status || "not ready").replaceAll("_", " ")}
        />
      </div>
    </div>
  );
}

function SiteField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-neutral-300">
      <span className="mb-2 block">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

function SiteTextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm text-neutral-300">
      <span className="mb-2 block">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

function DictationTextArea({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);

  function dictate() {
    const SpeechRecognition = (
      window as typeof window & {
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      document.getElementById(`site-visit-${name}`)?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setValue((current) => `${current}${current ? " " : ""}${transcript}`);
    };
    recognition.start();
  }

  return (
    <label className="block text-sm text-neutral-300">
      <span className="mb-2 flex items-center justify-between gap-3">
        {label}
        <button
          type="button"
          onClick={dictate}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#fb5411]"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Dictate
        </button>
      </span>
      <textarea
        id={`site-visit-${name}`}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        rows={5}
        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </label>
  );
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionResultEventLike) => void;
  start: () => void;
};

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

function FileInput({
  name,
  label,
  icon,
  capture,
  multiple,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  capture?: "user" | "environment";
  multiple?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-neutral-200">
      {icon}
      {label}
      <input
        className="sr-only"
        type="file"
        name={name}
        accept="image/*"
        capture={capture}
        multiple={multiple}
      />
    </label>
  );
}

function ReadOnlyDetail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-200">
        {value || "—"}
      </p>
    </div>
  );
}

function shortTime(value?: string | null) {
  return value ? value.slice(0, 5) : "";
}
