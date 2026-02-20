"use client";

import { useState } from "react";

const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSemG35X0R91Sdd-wt1OS-3Fxir9FBzsyPX0xws55ihM5bQ2-g/formResponse";

const ENTRY = {
  name: "entry.1515559186",
  phone: "entry.1408470442",
  email: "entry.1735989640",
  zip: "entry.1141022115",
  projectCategory: "entry.277952424",
  projectType: "entry.1821304697",
  comments: "entry.1864356264",
};

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.06a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-white/70"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuotePage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    zip: "",
    projectCategory: "",
    projectType: "",
    comments: "",
    disclaimer: false,
  });

  const canSubmit =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.zip.trim() &&
    form.projectCategory &&
    form.projectType &&
    form.disclaimer;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append(ENTRY.name, form.name);
      fd.append(ENTRY.phone, form.phone);
      fd.append(ENTRY.email, form.email);
      fd.append(ENTRY.zip, form.zip);
      fd.append(ENTRY.projectCategory, form.projectCategory);
      fd.append(ENTRY.projectType, form.projectType);
      fd.append(ENTRY.comments, form.comments);

      await fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        body: fd,
        mode: "no-cors",
      });

      setSubmitted(true);

      // Scroll fully to top smoothly after submission
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error(err);
      alert(
        "Something went wrong submitting the form. Please try again or call 202-309-6610."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black pt-28 sm:pt-32 pb-16 px-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10">
          <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight">
            Request a Free Quote
          </h1>
          <p className="text-white/75 mt-3 max-w-[720px]">
            Submitting this form initiates the estimation process. We’ll contact you
            within 24 hours to discuss your project and provide a firm quote based
            on your requirements.
          </p>

          <a
            href="tel:+13014414919"
            className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[#fb5411] px-5 py-3 text-white font-medium hover:bg-[#e64d0f] transition-colors"
          >
            <PhoneIcon className="size-5" />
            Call Now: 301-441-4919
          </a>
        </div>

        <div className="rounded-[14px] border border-white/10 bg-white/10 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="p-5 sm:p-7">
            {submitted ? (
              <div className="text-white">
                <h2 className="text-2xl font-semibold">
                  Thanks — we received your request.
                </h2>
                <p className="text-white/75 mt-2">
                  We’ll reach out within 24 hours. If it’s urgent, call{" "}
                  <a className="underline" href="tel:+13014414919">
                    301-441-4919
                  </a>.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Name */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">Name *</label>
                  <input
                    className="w-full rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Phone Number *
                  </label>
                  <input
                    className="w-full rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. (202) 555-1234"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    className="w-full rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    required
                  />
                </div>

                {/* Zip */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">ZIP Code *</label>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    placeholder="e.g. 20740"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Project Category *
                  </label>
                  <div className="relative">
                    <select
                      className="w-full rounded-[10px] bg-black/40 border border-white/15 pl-4 pr-12 py-3 text-white outline-none focus:border-white/30 appearance-none"
                      value={form.projectCategory}
                      onChange={(e) =>
                        setForm({ ...form, projectCategory: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                    <SelectChevron />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Project Type *
                  </label>
                  <div className="relative">
                    <select
                      className="w-full rounded-[10px] bg-black/40 border border-white/15 pl-4 pr-12 py-3 text-white outline-none focus:border-white/30 appearance-none"
                      value={form.projectType}
                      onChange={(e) =>
                        setForm({ ...form, projectType: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      <option value="Custom Design">Custom Design</option>
                      <option value="Railings">Railings</option>
                      <option value="Repairs">Repairs</option>
                      <option value="Security">Security</option>
                      <option value="Stairs">Stairs</option>
                      <option value="Other">Other</option>
                    </select>
                    <SelectChevron />
                  </div>
                </div>

                {/* Comments */}
                <div className="md:col-span-2">
                  <label className="block text-white/85 text-sm mb-2">
                    Comments or Specifics
                  </label>
                  <textarea
                    className="w-full min-h-[120px] rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.comments}
                    onChange={(e) => setForm({ ...form, comments: e.target.value })}
                    placeholder="e.g. 12 ft railing for front porch, installation needed within 4 weeks."
                  />
                </div>

                {/* Disclaimer */}
                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 text-white/80">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#fb5411]"
                      checked={form.disclaimer}
                      onChange={(e) =>
                        setForm({ ...form, disclaimer: e.target.checked })
                      }
                      required
                    />
                    <span>
                      I understand that providing this information does not guarantee service availability.
                      <br />
                      I consent to Paradise Ironworks and Construction contacting me regarding my project inquiry.
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="inline-flex justify-center rounded-[10px] bg-[#fb5411] px-6 py-3 text-white font-medium hover:bg-[#e64d0f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>

                  <p className="text-white/60 text-sm">
                    We usually respond within 24 hours.
                  </p>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
