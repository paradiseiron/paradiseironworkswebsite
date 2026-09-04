"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ImagePlus,
  Mic,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/roles";
import SelectedImagePreview from "@/components/SelectedImagePreview";
import { prepareImageInput } from "@/lib/image-compression";

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
  site_visit_assigned_to?: string | null;
};

type SiteVisitImage = { path: string; url: string; thumbnailUrl?: string };

type SiteVisitDraft = {
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
  estimators: { id: string; name: string }[];
  onToast?: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraPhotos, setCameraPhotos] = useState<File[]>([]);
  const [chosenPhotos, setChosenPhotos] = useState<File[]>([]);
  const selectedPhotos = [...cameraPhotos, ...chosenPhotos];
  const [removingImagePath, setRemovingImagePath] = useState("");
  const canEdit = role !== "viewer" && role !== "unassigned";
  const hasSubmittedDetails = Boolean(
    project.site_visit_scope_observations ||
      project.site_visit_notes ||
      project.site_visit_exclusion_notes ||
      project.site_visit_access_safety_concerns ||
      images.length
  );
  const [editing, setEditing] = useState(canEdit && !hasSubmittedDetails);
  const [savedVisit, setSavedVisit] = useState<SiteVisitDraft | null>(null);

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
          .upload(path, file, {
            contentType: file.type,
            cacheControl: "31536000",
            upsert: false,
          });
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
      setCameraPhotos([]);
      setChosenPhotos([]);
      setSavedVisit(nextVisit);
      setEditing(false);
      onToast?.("Site visit details saved successfully.");
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

  async function removeSiteVisitPhoto(path: string) {
    if (!window.confirm("Remove this site visit photo permanently?")) return;
    setRemovingImagePath(path);
    setMessage("");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/site-visit/images`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        }
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error || "Unable to remove site visit photo.");
      }
      router.refresh();
    } catch (removeError) {
      setMessage(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove site visit photo."
      );
    } finally {
      setRemovingImagePath("");
    }
  }

  if (!editing) {
    const details = savedVisit || {
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
            <h2 className="text-xl font-semibold">Site Visit Details</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {canEdit
                ? "Review the saved information from the site visit."
                : "This information is read-only for your account."}
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setEditing(true);
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit site visit
            </button>
          )}
        </div>
        <div className="mt-6 grid gap-5">
          <ReadOnlyDetail label="Site scope observations" value={details.scopeObservations} />
          <ReadOnlyDetail label="Visit notes" value={details.visitNotes} />
          <ReadOnlyDetail label="Exclusion notes" value={details.exclusionNotes} />
          <ReadOnlyDetail label="Access / safety concerns" value={details.accessSafetyConcerns} />
          {images.length > 0 && (
            <SiteVisitImageGallery
              images={images}
              canRemove={false}
              removingPath=""
              onRemove={() => undefined}
            />
          )}
        </div>
      </section>
    );
  }

  if (canEdit) {
    return (
      <section className="rounded-2xl border border-[#fb5411]/20 bg-white/[0.03] p-4 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">Site Visit Details</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Enter observations, notes, concerns, and photos from the visit.
          </p>
        </div>
        <form action={completeVisit} className="mt-6 space-y-5">
          <DictationTextArea
            label="Site scope observations"
            name="scope_observations"
            required
            defaultValue={
              project.site_visit_scope_observations || ""
            }
          />
          <DictationTextArea
            label="Visit notes"
            name="visit_notes"
            required
            defaultValue={
              project.site_visit_notes || ""
            }
          />
          <DictationTextArea
            label="Exclusion notes"
            name="exclusion_notes"
            defaultValue={
              project.site_visit_exclusion_notes || ""
            }
          />
          <DictationTextArea
            label="Access / safety concerns"
            name="access_safety_concerns"
            defaultValue={
              project.site_visit_access_safety_concerns || ""
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FileInput
              name="camera_photos"
              label="Take photos"
              icon={<Camera className="h-5 w-5" aria-hidden="true" />}
              capture="environment"
              onFilesSelected={setCameraPhotos}
            />
            <FileInput
              name="photos"
              label="Choose annotated photos"
              icon={<ImagePlus className="h-5 w-5" aria-hidden="true" />}
              multiple
              onFilesSelected={setChosenPhotos}
            />
          </div>
          {images.length > 0 && (
            <SiteVisitImageGallery
              images={images}
              canRemove
              removingPath={removingImagePath}
              onRemove={removeSiteVisitPhoto}
            />
          )}
          <SelectedImagePreview
            files={selectedPhotos}
            actionLabel="Will upload when site visit is saved"
          />
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
            {busy ? "Saving…" : "Save site visit details"}
          </button>
        </form>
      </section>
    );
  }

  return null;
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
  onFilesSelected,
}: {
  name: string;
  label: string;
  icon: React.ReactNode;
  capture?: "user" | "environment";
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
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
        onChange={async (event) =>
          onFilesSelected(await prepareImageInput(event.currentTarget))
        }
      />
    </label>
  );
}

function SiteVisitImageGallery({
  images,
  canRemove,
  removingPath,
  onRemove,
}: {
  images: SiteVisitImage[];
  canRemove: boolean;
  removingPath: string;
  onRemove: (path: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <div
          key={image.path}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900"
        >
          <a href={image.url} target="_blank" rel="noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.thumbnailUrl || image.url}
              alt="Site visit"
              className="aspect-square w-full object-cover"
            />
          </a>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(image.path)}
              disabled={Boolean(removingPath)}
              aria-label="Remove site visit photo"
              title="Remove photo"
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/30 bg-neutral-950/90 text-red-300 shadow-lg disabled:cursor-wait disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
    </div>
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
