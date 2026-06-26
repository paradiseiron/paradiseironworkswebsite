"use client";

import { useMemo, useState } from "react";

type FormState = {
  name: string;
  phone: string;
  email: string;
  zip: string;
  projectCategory: string;
  projectType: string;
  comments: string;
  disclaimer: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type TouchedState = Partial<Record<keyof FormState, boolean>>;

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  zip: "",
  projectCategory: "",
  projectType: "",
  comments: "",
  disclaimer: false,
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

function normalizePhone(value: string) {
  const raw = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  let normalizedDigits = digits;

  if (digits.startsWith("1")) {
    normalizedDigits = digits.slice(0, 11);
  } else {
    normalizedDigits = digits.slice(0, 10);
  }

  const hasCountryCode =
    normalizedDigits.length > 10 && normalizedDigits.startsWith("1");

  const local = hasCountryCode ? normalizedDigits.slice(1) : normalizedDigits;

  if (!local.length) return hasLeadingPlus ? "+" : "";

  let formattedLocal = "";

  if (local.length <= 3) {
    formattedLocal = local;
  } else if (local.length <= 6) {
    formattedLocal = `(${local.slice(0, 3)}) ${local.slice(3)}`;
  } else {
    formattedLocal = `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(
      6,
      10
    )}`;
  }

  if (hasCountryCode || hasLeadingPlus) {
    return `+1 ${formattedLocal}`;
  }

  return formattedLocal;
}

function normalizeZip(value: string) {
  return value.replace(/[^\d-]/g, "").slice(0, 10);
}

function normalizeSubmittedPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return value;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const zip = form.zip.trim();
  const phoneDigits = form.phone.replace(/\D/g, "");

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length < 2) {
    errors.name = "Name looks too short.";
  }

  if (!phoneDigits) {
    errors.phone = "Please enter your phone number.";
  } else if (
    !(
      phoneDigits.length === 10 ||
      (phoneDigits.length === 11 && phoneDigits.startsWith("1"))
    )
  ) {
    errors.phone = "Enter a valid US phone number, with or without +1.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!zip) {
    errors.zip = "Please enter your ZIP code.";
  } else if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    errors.zip = "Enter a valid ZIP code.";
  }

  if (!form.projectCategory) {
    errors.projectCategory = "Please choose a project category.";
  }

  if (!form.projectType) {
    errors.projectType = "Please choose a project type.";
  }

  if (!form.disclaimer) {
    errors.disclaimer = "You must agree before submitting.";
  }

  return errors;
}

export default function QuotePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched<K extends keyof FormState>(field: K) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function getFieldError(field: keyof FormState) {
    return touched[field] ? errors[field] : undefined;
  }

  function inputClass(hasError: boolean) {
    return `w-full rounded-[10px] bg-black/40 border px-4 py-3 text-white outline-none transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-400"
        : "border-white/15 focus:border-white/30"
    }`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({
      name: true,
      phone: true,
      email: true,
      zip: true,
      projectCategory: true,
      projectType: true,
      comments: true,
      disclaimer: true,
    });

    const currentErrors = validateForm(form);

    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: normalizeSubmittedPhone(form.phone),
          email: form.email.trim(),
          zip: form.zip.trim(),
          projectCategory: form.projectCategory,
          projectType: form.projectType,
          comments: form.comments.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit quote request.");
      }

      setSubmitted(true);

      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error(err);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the form. Please try again or call 301-441-4919."
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
              <form
                onSubmit={onSubmit}
                noValidate
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Name *
                  </label>
                  <input
                    className={inputClass(Boolean(getFieldError("name")))}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    onBlur={() => markTouched("name")}
                    placeholder="e.g. John Smith"
                    autoComplete="name"
                    aria-invalid={Boolean(getFieldError("name"))}
                  />
                  {getFieldError("name") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Phone Number *
                  </label>
                  <input
                    className={inputClass(Boolean(getFieldError("phone")))}
                    value={form.phone}
                    onChange={(e) =>
                      setField("phone", normalizePhone(e.target.value))
                    }
                    onBlur={() => markTouched("phone")}
                    placeholder="e.g. (202) 555-1234 or +1 (202) 555-1234"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(getFieldError("phone"))}
                  />
                  {getFieldError("phone") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("phone")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className={inputClass(Boolean(getFieldError("email")))}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onBlur={() => markTouched("email")}
                    placeholder="e.g. john@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(getFieldError("email"))}
                  />
                  {getFieldError("email") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    ZIP Code *
                  </label>
                  <input
                    className={inputClass(Boolean(getFieldError("zip")))}
                    value={form.zip}
                    onChange={(e) => setField("zip", normalizeZip(e.target.value))}
                    onBlur={() => markTouched("zip")}
                    placeholder="e.g. 20740"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    aria-invalid={Boolean(getFieldError("zip"))}
                  />
                  {getFieldError("zip") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("zip")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Project Category *
                  </label>
                  <div className="relative">
                    <select
                      className={`${inputClass(
                        Boolean(getFieldError("projectCategory"))
                      )} appearance-none pr-12`}
                      value={form.projectCategory}
                      onChange={(e) =>
                        setField("projectCategory", e.target.value)
                      }
                      onBlur={() => markTouched("projectCategory")}
                      aria-invalid={Boolean(getFieldError("projectCategory"))}
                    >
                      <option value="">Choose…</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                    <SelectChevron />
                  </div>
                  {getFieldError("projectCategory") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("projectCategory")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-white/85 text-sm mb-2">
                    Project Type *
                  </label>
                  <div className="relative">
                    <select
                      className={`${inputClass(
                        Boolean(getFieldError("projectType"))
                      )} appearance-none pr-12`}
                      value={form.projectType}
                      onChange={(e) => setField("projectType", e.target.value)}
                      onBlur={() => markTouched("projectType")}
                      aria-invalid={Boolean(getFieldError("projectType"))}
                    >
                      <option value="">Choose…</option>
                      <option value="Custom Design">Custom Design</option>
                      <option value="Railings">Railings</option>
                      <option value="Repairs">Repairs</option>
                      <option value="Security">Security</option>
                      <option value="Stairs">Stairs</option>
                      <option value="Other">Other</option>
                    </select>
                    <SelectChevron />
                  </div>
                  {getFieldError("projectType") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("projectType")}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/85 text-sm mb-2">
                    Comments or Specifics
                  </label>
                  <textarea
                    className="w-full min-h-[120px] rounded-[10px] bg-black/40 border border-white/15 px-4 py-3 text-white outline-none focus:border-white/30"
                    value={form.comments}
                    onChange={(e) => setField("comments", e.target.value)}
                    onBlur={() => markTouched("comments")}
                    placeholder="e.g. 12 ft railing for front porch, installation needed within 4 weeks."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 text-white/80">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#fb5411]"
                      checked={form.disclaimer}
                      onChange={(e) =>
                        setField("disclaimer", e.target.checked)
                      }
                      onBlur={() => markTouched("disclaimer")}
                      aria-invalid={Boolean(getFieldError("disclaimer"))}
                    />

                    <span>
                      I understand that providing this information does not guarantee
                      service availability.
                      <br />I consent to Paradise Ironworks and Construction contacting
                      me regarding my project inquiry.
                    </span>
                  </label>

                  {getFieldError("disclaimer") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("disclaimer")}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="submit"
                    disabled={submitting || !isValid}
                    className="inline-flex justify-center rounded-[10px] bg-[#fb5411] px-6 py-3 text-white font-medium hover:bg-[#e64d0f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>

                  <p className="text-white/60 text-sm">
                    We usually respond within 24 hours.
                  </p>
                </div>

                {submitError && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-red-400">{submitError}</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}