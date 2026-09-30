"use client";

import { useState } from "react";
import { CAMPAIGN_ACCENTS, CAMPAIGN_IMAGE_POSITIONS, CAMPAIGN_LAYOUTS, renderCampaignEmail, type CampaignDesign } from "@/lib/email/campaign-template";
import { CUSTOMER_TYPES } from "@/lib/customer-types";

type Draft = CampaignDesign & { name?: string | null; subject?: string | null; audience_type?: string | null };

export default function CampaignComposer({
  action,
  draft,
  siteUrl,
  submitLabel = "Save draft",
  formId,
  showSubmit = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  draft?: Draft;
  siteUrl: string;
  submitLabel?: string;
  formId?: string;
  showSubmit?: boolean;
}) {
  const [design, setDesign] = useState<CampaignDesign>({
    headline: draft?.headline || "",
    body: draft?.body || "",
    layout: draft?.layout || "centered",
    image_position: draft?.image_position || "above",
    accent_color: draft?.accent_color || "#fb5411",
    cta_label: draft?.cta_label || "",
    cta_url: draft?.cta_url || "",
    postal_address: draft?.postal_address || "",
    images: draft?.images || [],
  });
  const [previewOpen, setPreviewOpen] = useState(true);
  const [subject, setSubject] = useState(draft?.subject || "");
  function update(event: React.FormEvent<HTMLFormElement>) {
    const values = new FormData(event.currentTarget);
    setSubject(String(values.get("subject") || ""));
    setDesign((current) => ({
      ...current,
      headline: String(values.get("headline") || ""),
      body: String(values.get("body") || ""),
      layout: String(values.get("layout") || "centered"),
      image_position: String(values.get("image_position") || "above"),
      accent_color: String(values.get("accent_color") || "#fb5411"),
      cta_label: String(values.get("cta_label") || ""),
      cta_url: String(values.get("cta_url") || ""),
      postal_address: String(values.get("postal_address") || ""),
    }));
  }
  const preview = renderCampaignEmail(design, siteUrl, `${siteUrl}/unsubscribe/preview`);

  return <div className="grid gap-6 lg:grid-cols-2">
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-xl font-semibold">Campaign draft</h2>
      <form id={formId} action={action} onInput={update} onChange={update} className="mt-5 space-y-4">
        <Field label="Internal name" name="name" defaultValue={draft?.name || ""} required />
        <Field label="Email subject" name="subject" defaultValue={draft?.subject || ""} required />
        <Field label="Headline" name="headline" defaultValue={draft?.headline || ""} />
        <label className="block text-sm text-neutral-300">Audience<select name="audience_type" defaultValue={draft?.audience_type || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white"><option value="">All customers with email</option>{CUSTOMER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
        <label className="block text-sm text-neutral-300">Message<textarea name="body" required defaultValue={draft?.body || ""} rows={8} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Text alignment" name="layout" value={draft?.layout || "centered"} options={CAMPAIGN_LAYOUTS} />
          <Select label="Accent color" name="accent_color" value={draft?.accent_color || "#fb5411"} options={CAMPAIGN_ACCENTS} />
          <Select label="Image placement" name="image_position" value={draft?.image_position || "above"} options={CAMPAIGN_IMAGE_POSITIONS} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Button text" name="cta_label" defaultValue={draft?.cta_label || ""} /><Field label="Button link (HTTPS)" name="cta_url" defaultValue={draft?.cta_url || ""} type="url" /></div>
        <Field label="Physical mailing address for footer" name="postal_address" defaultValue={draft?.postal_address || ""} />
        {showSubmit && <button className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white">{submitLabel}</button>}
      </form>
    </section>
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Email preview</h2><p className="mt-1 text-xs text-neutral-400">Updates as you edit. Save the draft before launching.</p></div><button type="button" onClick={() => setPreviewOpen((open) => !open)} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white">{previewOpen ? "Hide" : "Show"}</button></div>
      {previewOpen && <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white"><div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800"><span className="font-semibold">Subject:</span> {subject || "(No subject yet)"}</div><iframe title="Campaign email preview" srcDoc={preview} sandbox="" className="h-[720px] w-full bg-white" /></div>}
    </section>
  </div>;
}

function Field({ label, name, defaultValue, required, type = "text" }: { label: string; name: string; defaultValue: string; required?: boolean; type?: string }) {
  return <label className="block text-sm text-neutral-300">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /></label>;
}
function Select({ label, name, value, options }: { label: string; name: string; value: string; options: readonly { value: string; label: string }[] }) {
  return <label className="block text-sm text-neutral-300">{label}<select name={name} defaultValue={value} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
