"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";

export default function JobApplicationForm({ jobId, jobSlug }: { jobId: string; jobSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = new FormData(event.currentTarget);
      body.set("job_id", jobId); body.set("started_at", String(startedAt));
      const response = await fetch("/api/careers/apply", { method: "POST", body });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "Unable to submit your application.");
      router.push(`/careers/application-confirmation?position=${encodeURIComponent(jobSlug)}`);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to submit your application."); setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-8">
    <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-px w-px" aria-hidden="true" />
    <FormSection title="Contact information"><div className="grid gap-5 sm:grid-cols-2"><Field name="first_name" label="First name" required autoComplete="given-name" /><Field name="last_name" label="Last name" required autoComplete="family-name" /><Field name="email" label="Email" type="email" required autoComplete="email" /><Field name="phone" label="Phone" type="tel" required autoComplete="tel" /><Field name="address" label="Street address" autoComplete="street-address" wide /><Field name="city" label="City" autoComplete="address-level2" /><Field name="state" label="State" autoComplete="address-level1" /><Field name="postal_code" label="ZIP code" autoComplete="postal-code" /></div></FormSection>
    <FormSection title="Experience"><div className="grid gap-5 sm:grid-cols-2"><Field name="current_employer" label="Current or most recent employer" /><Field name="current_title" label="Current or most recent title" /><Field name="years_experience" label="Years of relevant experience" type="number" min="0" max="60" /><Field name="desired_compensation" label="Desired compensation" /><Field name="linkedin_url" label="LinkedIn profile" type="url" /><Field name="website_url" label="Portfolio or website" type="url" /><Area name="education" label="Education and training" wide /><Area name="skills" label="Relevant skills, licenses, and certifications" wide /><Area name="message" label="Why are you interested in this position?" wide /></div></FormSection>
    <FormSection title="Availability and eligibility"><div className="grid gap-5 sm:grid-cols-2"><Field name="start_date" label="Available start date" type="date" /><Field name="referral_source" label="How did you hear about us?" /><Choice name="work_authorized" label="Are you authorized to work in the United States?" /><Choice name="sponsorship_required" label="Will you require employment sponsorship?" /><label className="flex items-start gap-3 text-sm text-zinc-700 sm:col-span-2"><input required type="checkbox" name="age_confirmed" value="yes" className="mt-1 size-4 accent-[#fb5411]" />I confirm that I am at least 18 years old.</label></div></FormSection>
    <FormSection title="Documents"><div className="grid gap-5 sm:grid-cols-2"><Upload name="resume" label="Resume" required help="PDF, DOC, or DOCX. Maximum 10 MB." /><Upload name="supporting_documents" label="Supporting documents or certificates" multiple help="Up to 5 PDF, Word, JPG, or PNG files. Maximum 10 MB each." /></div></FormSection>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="rounded-xl bg-[#fb5411] px-6 py-3 font-semibold text-white transition hover:bg-[#e64d0f] disabled:opacity-60">{busy ? "Submitting…" : "Submit application"}</button>
  </form>;
}

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 outline-none focus:border-[#fb5411] focus:ring-2 focus:ring-[#fb5411]/15";
function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="mb-5 text-xl font-semibold text-zinc-900">{title}</h2>{children}</section>; }
function Field({ label, wide, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) { return <label className={`text-sm font-medium text-zinc-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{props.required && " *"}<input {...props} className={fieldClass} /></label>; }
function Area({ label, name, wide }: { label: string; name: string; wide?: boolean }) { return <label className={`text-sm font-medium text-zinc-700 ${wide ? "sm:col-span-2" : ""}`}>{label}<textarea name={name} rows={4} className={`${fieldClass} h-auto py-3`} /></label>; }
function Choice({ label, name }: { label: string; name: string }) { return <fieldset><legend className="text-sm font-medium text-zinc-700">{label} *</legend><div className="mt-3 flex gap-5"><label className="flex items-center gap-2"><input required type="radio" name={name} value="yes" className="accent-[#fb5411]" />Yes</label><label className="flex items-center gap-2"><input required type="radio" name={name} value="no" className="accent-[#fb5411]" />No</label></div></fieldset>; }
function Upload({ label, name, required, multiple, help }: { label: string; name: string; required?: boolean; multiple?: boolean; help: string }) { return <label className="block rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm font-medium text-zinc-700"><span className="flex items-center gap-2"><FileUp className="size-5 text-[#fb5411]" />{label}{required && " *"}</span><input className="mt-4 block w-full text-sm" type="file" name={name} required={required} multiple={multiple} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" /><span className="mt-2 block text-xs font-normal text-zinc-500">{help}</span></label>; }
