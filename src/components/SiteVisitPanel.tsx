"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Mic, Save } from "lucide-react";
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

export default function SiteVisitPanel({
  project,
  role,
  images,
}: {
  project: SiteVisitProject;
  role: UserRole;
  images: SiteVisitImage[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const defaultLocation = [
    project.project_address,
    project.city,
    project.state,
    project.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
  const status = project.site_visit_status || "not_ready";

  async function markReady(formData: FormData) {
    setBusy(true);
    setMessage("");
    const response = await fetch(
      `/api/projects/${encodeURIComponent(project.id)}/site-visit/ready`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: formData.get("scheduled_date"),
          windowStart: formData.get("window_start"),
          windowEnd: formData.get("window_end"),
          location: formData.get("location"),
          adminNotes: formData.get("admin_notes"),
        }),
      }
    );
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    setBusy(false);
    if (!response.ok) {
      setMessage(body?.error || "Unable to schedule site visit.");
      return;
    }
    setMessage("Estimator notified.");
    router.refresh();
  }

  async function completeVisit(formData: FormData) {
    setBusy(true);
    setMessage("Uploading site photos…");

    try {
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

      setMessage("Saving site visit…");
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/site-visit/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scopeObservations: formData.get("scope_observations"),
            visitNotes: formData.get("visit_notes"),
            exclusionNotes: formData.get("exclusion_notes"),
            accessSafetyConcerns: formData.get("access_safety_concerns"),
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

      setMessage("Site visit completed. Admin notified.");
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

  if (role === "admin" && status !== "completed") {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Schedule Site Visit</h2>
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
              defaultValue={project.site_visit_scheduled_date || ""}
            />
            <SiteField
              label="Window start"
              name="window_start"
              type="time"
              required
              defaultValue={shortTime(project.site_visit_window_start)}
            />
            <SiteField
              label="Window end"
              name="window_end"
              type="time"
              required
              defaultValue={shortTime(project.site_visit_window_end)}
            />
          </div>
          <SiteField
            label="Location"
            name="location"
            required
            defaultValue={project.site_visit_location || defaultLocation}
          />
          <SiteTextArea
            label="Instructions for estimator"
            name="admin_notes"
            defaultValue={project.site_visit_admin_notes || ""}
          />
          {message && <p className="text-sm text-amber-200">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Notifying…"
              : status === "ready"
                ? "Update visit and notify estimator"
                : "Mark ready and notify estimator"}
          </button>
        </form>
      </section>
    );
  }

  if (role === "estimator" && status === "ready") {
    return (
      <section className="rounded-2xl border border-[#fb5411]/20 bg-white/[0.03] p-4 sm:p-6">
        <VisitSchedule project={project} />
        <form action={completeVisit} className="mt-6 space-y-5">
          <DictationTextArea
            label="Site scope observations"
            name="scope_observations"
            required
            defaultValue={project.site_visit_scope_observations || ""}
          />
          <DictationTextArea
            label="Visit notes"
            name="visit_notes"
            required
            defaultValue={project.site_visit_notes || ""}
          />
          <DictationTextArea
            label="Exclusion notes"
            name="exclusion_notes"
            defaultValue={project.site_visit_exclusion_notes || ""}
          />
          <DictationTextArea
            label="Access / safety concerns"
            name="access_safety_concerns"
            defaultValue={project.site_visit_access_safety_concerns || ""}
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
          {message && <p className="text-sm text-amber-200">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? "Submitting…" : "Complete site visit"}
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
