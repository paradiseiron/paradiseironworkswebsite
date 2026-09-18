"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, ExternalLink, FileCheck2, ImagePlus, Mail, Pencil, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { prepareImageInput } from "@/lib/image-compression";
import SelectedImagePreview from "@/components/SelectedImagePreview";
import { generatePortfolioDraft } from "@/lib/portfolio-draft";
import SuccessToast from "@/components/SuccessToast";

type CloseProject = {
  id: string;
  customer_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  project_category?: string | null;
  project_type?: string | null;
  proposal_project_name?: string | null;
  proposal_scope?: string | null;
  proposal_finish?: string | null;
  completed_at?: string | null;
  review_request_sent_at?: string | null;
};

export type PortfolioDraft = {
  slug?: string | null;
  name?: string | null;
  location?: string | null;
  work_type?: string | null;
  product_types?: string[] | null;
  description?: string | null;
  summary?: string | null;
  year?: number | null;
  image_paths?: string[] | null;
  image_alt?: string | null;
  specifications?: unknown;
  seo_title?: string | null;
  meta_description?: string | null;
} | null;

export default function ProjectClosePanel({ project, portfolio }: { project: CloseProject; portfolio: PortfolioDraft }) {
  const [savedPortfolio, setSavedPortfolio] = useState<NonNullable<PortfolioDraft> | null>(portfolio);
  const [editingPortfolio, setEditingPortfolio] = useState(!portfolio);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const initialPaths = portfolio?.image_paths || [];
  const [imagePaths, setImagePaths] = useState<string[]>(initialPaths);
  const [imageUrls, setImageUrls] = useState<string[]>(() => initialPaths.map(publicImageUrl));
  const [cameraPhotos, setCameraPhotos] = useState<File[]>([]);
  const [chosenPhotos, setChosenPhotos] = useState<File[]>([]);
  const selectedPhotos = [...cameraPhotos, ...chosenPhotos];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewSentAt, setReviewSentAt] = useState(project.review_request_sent_at || "");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [allowReviewResend, setAllowReviewResend] = useState(false);
  const generated = generatePortfolioDraft(project);
  const defaultName = project.proposal_project_name || project.project_type || project.customer_name || "";
  const defaultLocation = [project.city, project.state].filter(Boolean).join(", ");
  const workType = titleCase(project.project_category || "Not specified");
  const yearCompleted = project.completed_at
    ? new Date(project.completed_at).getFullYear()
    : null;
  const specs = savedPortfolio
    ? (Array.isArray(savedPortfolio.specifications) ? savedPortfolio.specifications.map((item) => {
        const spec = item as { label?: string; value?: string };
        return spec.label && spec.value ? `${spec.label}: ${spec.value}` : "";
      }).filter(Boolean).join("\n") : "")
    : generated.specifications;

  async function publish(formData: FormData) {
    const uploadedPaths: string[] = [];
    setBusy(true);
    setMessage("");
    try {
      if (selectedPhotos.length > 10) {
        throw new Error("You can attach up to 10 final project photos at a time.");
      }
      const totalPhotoBytes = selectedPhotos.reduce(
        (total, photo) => total + photo.size,
        0
      );
      if (totalPhotoBytes > 45 * 1024 * 1024) {
        throw new Error("Final project photos must total 45 MB or less.");
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired.");
      const uploadedUrls: string[] = [];

      for (const file of selectedPhotos) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${project.id}/${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("portfolio-images").upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw error;
        uploadedPaths.push(path);
        uploadedUrls.push(supabase.storage.from("portfolio-images").getPublicUrl(path).data.publicUrl);
      }
      const nextImagePaths = [...imagePaths, ...uploadedPaths];
      const productTypes = String(formData.get("product_types") || "").split(",").map((value) => value.trim()).filter(Boolean);
      const specifications = parseSpecifications(String(formData.get("specifications") || ""));
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: formData.get("slug"),
          name: formData.get("name"),
          productTypes,
          description: formData.get("description"),
          summary: formData.get("summary"),
          imagePaths: nextImagePaths,
          imageAlt: formData.get("image_alt"),
          specifications,
          seoTitle: formData.get("seo_title"),
          metaDescription: formData.get("meta_description"),
        }),
      });
      const body = await response.json().catch(() => null) as { error?: string; slug?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Unable to publish portfolio project.");
      setImagePaths(nextImagePaths);
      setImageUrls((current) => [...current, ...uploadedUrls]);
      setCameraPhotos([]);
      setChosenPhotos([]);
      setSavedPortfolio({
        slug: body?.slug || String(formData.get("slug") || ""),
        name: String(formData.get("name") || ""),
        location: defaultLocation,
        work_type: workType,
        year: yearCompleted,
        product_types: productTypes,
        description: String(formData.get("description") || ""),
        summary: String(formData.get("summary") || ""),
        image_paths: nextImagePaths,
        image_alt: String(formData.get("image_alt") || ""),
        specifications,
        seo_title: String(formData.get("seo_title") || ""),
        meta_description: String(formData.get("meta_description") || ""),
      });
      setEditingPortfolio(false);
      setToastMessage(savedPortfolio ? "Portfolio project updated successfully." : "Portfolio project published successfully.");
      setToastKey((key) => key + 1);
    } catch (error) {
      if (uploadedPaths.length) await createClient().storage.from("portfolio-images").remove(uploadedPaths);
      setMessage(error instanceof Error ? error.message : "Unable to publish portfolio project.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReviewRequest() {
    setBusy(true);
    setReviewError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/review-request`, { method: "POST" });
      const body = await response.json().catch(() => null) as { error?: string; sentAt?: string } | null;
      if (!response.ok) throw new Error(body?.error || "Unable to send review request.");
      setReviewSentAt(body?.sentAt || new Date().toISOString());
      setAllowReviewResend(false);
      setReviewModalOpen(false);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Unable to send review request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {toastKey > 0 && <SuccessToast key={toastKey} message={toastMessage} />}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <h2 className="text-xl font-semibold">Close Project</h2>
        <p className="mt-1 text-sm text-neutral-400">Issue a final receipt, publish the finished work, and request a customer review.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/admin/projects/${project.id}/receipt`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white">
            <FileCheck2 className="h-4 w-4" /> Preview final receipt
          </Link>
          <Link href={`/admin/projects/${project.id}/receipt/pdf`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200">
            <Upload className="h-4 w-4" /> Download receipt PDF
          </Link>
          <button type="button" onClick={() => { setReviewError(""); setReviewModalOpen(true); }} disabled={busy || !project.email || Boolean(reviewSentAt && !allowReviewResend)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50">
            <Mail className="h-4 w-4" /> {reviewSentAt ? "Resend Google review request" : "Request Google review"}
          </button>
          {reviewSentAt && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <span className="inline-flex items-center gap-2 text-xs text-emerald-100">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Sent {new Date(reviewSentAt).toLocaleString()}
              </span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-neutral-300">
                <input type="checkbox" checked={allowReviewResend} onChange={(event) => setAllowReviewResend(event.target.checked)} className="h-4 w-4 accent-[#fb5411]" />
                Allow resend
              </label>
            </div>
          )}
        </div>
        {!project.email && <p className="mt-3 text-sm text-amber-200">Add a customer email to enable the review request.</p>}
      </section>

      {reviewModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setReviewModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="review-request-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="review-request-title" className="text-xl font-semibold text-white">Send Google review request?</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-400">An email with the Google review link will be sent to <span className="font-semibold text-neutral-200">{project.email}</span>.</p>
              </div>
              <button type="button" onClick={() => setReviewModalOpen(false)} disabled={busy} aria-label="Close review request confirmation" className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            {reviewError && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{reviewError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setReviewModalOpen(false)} disabled={busy} className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={sendReviewRequest} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white transition hover:bg-[#e64d0f] disabled:opacity-60"><Mail className="h-4 w-4" />{busy ? "Sending…" : "Send email"}</button>
            </div>
          </section>
        </div>
      )}

      {savedPortfolio && !editingPortfolio ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h2 className="text-xl font-semibold">Marketing Portfolio</h2><p className="mt-1 text-sm text-neutral-400">Published on the public website.</p></div>
            <div className="flex flex-wrap items-center gap-3">
              {savedPortfolio.slug && <Link href={`/ironwork-projects/${savedPortfolio.slug}`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200">View published project <ExternalLink className="h-4 w-4" /></Link>}
              <button type="button" onClick={() => setEditingPortfolio(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white"><Pencil className="h-4 w-4" />Edit portfolio</button>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <ReadOnlyValue label="Portfolio project name" value={savedPortfolio.name} />
            <ReadOnlyValue label="URL slug" value={savedPortfolio.slug} />
            <ReadOnlyValue label="Product types" value={savedPortfolio.product_types?.join(", ")} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ProjectValue label="Year completed" value={savedPortfolio.year ? String(savedPortfolio.year) : "Not completed"} />
            <ProjectValue label="Work type" value={savedPortfolio.work_type || workType} />
            <ProjectValue label="Location" value={savedPortfolio.location || "Not specified"} />
          </div>
          <div className="mt-5 grid gap-5">
            <ReadOnlyValue label="Description" value={savedPortfolio.description} />
            <ReadOnlyValue label="Short summary" value={savedPortfolio.summary} />
            <ReadOnlyValue label="Specifications" value={specs} />
            <ReadOnlyValue label="Image alt text" value={savedPortfolio.image_alt} />
            <ReadOnlyValue label="SEO title" value={savedPortfolio.seo_title} />
            <ReadOnlyValue label="Meta description" value={savedPortfolio.meta_description} />
          </div>
          {savedPortfolio.image_paths && savedPortfolio.image_paths.length > 0 && <section className="mt-6"><h3 className="text-sm font-semibold text-neutral-200">Final Project Photos</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{savedPortfolio.image_paths.map((path, index) => <div key={`${path}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicImageUrl(path)} alt={savedPortfolio.image_alt || `Final project photo ${index + 1}`} className="aspect-square w-full rounded-xl border border-white/10 object-cover" />
          </div>)}</div></section>}
        </section>
      ) : <form action={publish} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Marketing Portfolio</h2><p className="mt-1 text-sm text-neutral-400">Submitting this form publishes or updates the project on the public website. Suggested copy uses project details; review it before publishing.</p></div>
          {savedPortfolio?.slug && <Link href={`/ironwork-projects/${savedPortfolio.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm text-orange-300">View published project <ExternalLink className="h-4 w-4" /></Link>}
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Portfolio project name" name="name" required defaultValue={savedPortfolio?.name || defaultName} />
          <Field label="URL slug" name="slug" required defaultValue={savedPortfolio?.slug || generated.slug} help="Suggested from the work type and location, following existing portfolio URLs. You can edit it." />
          <Field label="Product types" name="product_types" required defaultValue={(savedPortfolio?.product_types || [project.project_type].filter(Boolean)).join(", ")} help="Separate multiple types with commas." />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ProjectValue label="Year completed" value={yearCompleted ? String(yearCompleted) : "Not completed"} />
          <ProjectValue label="Work type" value={workType} />
          <ProjectValue label="Location" value={defaultLocation || "Not specified"} />
        </div>
        <div className="mt-5 grid gap-5">
          <Area label="Description" name="description" required defaultValue={savedPortfolio ? savedPortfolio.description || "" : generated.description} />
          <Area label="Short summary" name="summary" defaultValue={savedPortfolio ? savedPortfolio.summary || "" : generated.summary} />
          <Area label="Specifications" name="specifications" defaultValue={specs} help="One per line, formatted as Label: Value." />
          <Field label="Image alt text" name="image_alt" defaultValue={savedPortfolio ? savedPortfolio.image_alt || "" : generated.imageAlt} />
          <Field label="SEO title" name="seo_title" defaultValue={savedPortfolio ? savedPortfolio.seo_title || "" : generated.seoTitle} />
          <Area label="Meta description" name="meta_description" defaultValue={savedPortfolio ? savedPortfolio.meta_description || "" : generated.metaDescription} />
        </div>
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Final Project Photos</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Attach photos of the completed project for the marketing portfolio. The first photo becomes the portfolio thumbnail.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PhotoInput name="camera_photos" label="Take photos" icon={<Camera className="h-5 w-5" aria-hidden="true" />} capture="environment" disabled={busy} onFilesSelected={setCameraPhotos} />
            <PhotoInput name="photos" label="Choose photos" icon={<ImagePlus className="h-5 w-5" aria-hidden="true" />} multiple disabled={busy} onFilesSelected={setChosenPhotos} />
          </div>
          <div className="mt-4">
            <SelectedImagePreview files={selectedPhotos} actionLabel="Will upload when project is saved" onRemove={(index) => { if (index < cameraPhotos.length) setCameraPhotos((photos) => photos.filter((_, photoIndex) => photoIndex !== index)); else setChosenPhotos((photos) => photos.filter((_, photoIndex) => photoIndex !== index - cameraPhotos.length)); }} />
          </div>
          {imageUrls.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{imageUrls.map((url, index) => <div key={`${url}-${index}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Final project upload ${index + 1}`} className="aspect-square w-full rounded-xl border border-white/10 object-cover" /><button type="button" onClick={() => { setImagePaths((paths) => paths.filter((_, i) => i !== index)); setImageUrls((urls) => urls.filter((_, i) => i !== index)); }} className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white">Remove on save</button></div>)}</div>}
        </section>
        {message && <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-amber-100">{message}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Working…" : savedPortfolio ? "Update portfolio project" : "Publish to portfolio"}</button>
          {savedPortfolio && <button type="button" disabled={busy} onClick={() => { setImagePaths(savedPortfolio.image_paths || []); setImageUrls((savedPortfolio.image_paths || []).map(publicImageUrl)); setCameraPhotos([]); setChosenPhotos([]); setMessage(""); setEditingPortfolio(false); }} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-neutral-200 disabled:opacity-60">Cancel</button>}
        </div>
      </form>}
    </div>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]";
function Field({ label, name, defaultValue, required, type = "text", help, placeholder }: { label: string; name: string; defaultValue: string; required?: boolean; type?: string; help?: string; placeholder?: string }) { return <label className="text-sm text-neutral-300"><span className="mb-2 block">{label}</span><input className={inputClass} name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} />{help && <span className="mt-1 block text-xs text-neutral-500">{help}</span>}</label>; }
function Area({ label, name, defaultValue, required, help }: { label: string; name: string; defaultValue: string; required?: boolean; help?: string }) { return <label className="text-sm text-neutral-300"><span className="mb-2 block">{label}</span><textarea className="min-h-28 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-[#fb5411]" name={name} required={required} defaultValue={defaultValue} />{help && <span className="mt-1 block text-xs text-neutral-500">{help}</span>}</label>; }
function parseSpecifications(value: string) { return value.split("\n").map((line) => { const [label, ...rest] = line.split(":"); return { label: label.trim(), value: rest.join(":").trim() }; }).filter((item) => item.label && item.value); }
function publicImageUrl(path: string) { const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""; return `${base}/storage/v1/object/public/portfolio-images/${encodeURI(path)}`; }
function titleCase(value: string) { return value.replace(/(^|[_\s-])\S/g, (match) => match.toUpperCase()).replaceAll("_", " "); }
function ProjectValue({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><p className="text-xs uppercase tracking-[0.15em] text-neutral-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value}</p></div>; }
function ReadOnlyValue({ label, value }: { label: string; value?: string | null }) { return <div><p className="text-sm text-neutral-400">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm text-white">{value || "—"}</p></div>; }
function PhotoInput({ name, label, icon, capture, multiple, disabled, onFilesSelected }: { name: string; label: string; icon: React.ReactNode; capture?: "user" | "environment"; multiple?: boolean; disabled?: boolean; onFilesSelected: (files: File[]) => void }) { return <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white">{icon}{label}<input className="sr-only" type="file" name={name} accept="image/*" capture={capture} multiple={multiple} disabled={disabled} onChange={async (event) => { const input = event.currentTarget; const files = await prepareImageInput(input); onFilesSelected(files); input.value = ""; }} /></label>; }
