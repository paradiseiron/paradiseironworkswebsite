"use client";

import { useMemo, useRef, useState } from "react";
import {
  ENGINEERING_SERVICES_OPTIONS,
  PROJECT_TYPES,
  requiresEngineeringServices,
} from "@/lib/project-options";
import {
  isAllowedQuoteAttachment,
  QUOTE_ATTACHMENT_MAX_FILES,
  QUOTE_ATTACHMENT_MAX_FILE_BYTES,
  QUOTE_ATTACHMENT_MAX_TOTAL_BYTES,
} from "@/lib/quote-attachments";

type FormState = {
  name: string;
  phone: string;
  email: string;
  zip: string;
  projectCategory: string;
  projectType: string;
  engineeringServices: string;
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
  engineeringServices: "",
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

  if (
    requiresEngineeringServices(form.projectType) &&
    !form.engineeringServices
  ) {
    errors.engineeringServices = "Please choose an engineering service option.";
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
  const [submissionWarning, setSubmissionWarning] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [isDraggingAttachments, setIsDraggingAttachments] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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
      engineeringServices: true,
      comments: true,
      disclaimer: true,
    });

    const currentErrors = validateForm(form);

    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    let quoteSaved = false;
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
          engineeringServices: requiresEngineeringServices(form.projectType)
            ? form.engineeringServices
            : null,
          comments: form.comments.trim(),
          attachments: attachments.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit quote request.");
      }
      quoteSaved = true;

      if (attachments.length) {
        const uploads = Array.isArray(data?.uploads) ? data.uploads : [];
        if (uploads.length !== attachments.length) {
          throw new Error("Your quote was saved, but its attachments could not be prepared.");
        }

        for (let index = 0; index < attachments.length; index += 1) {
          const upload = uploads[index];
          const uploadBody = new FormData();
          uploadBody.append("cacheControl", "3600");
          uploadBody.append("", attachments[index]);
          const uploadResponse = await fetch(upload.signedUrl, {
            method: "PUT",
            headers: { "x-upsert": "false" },
            body: uploadBody,
          });
          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse
              .json()
              .catch(() => null);
            throw new Error(
              uploadError?.message ||
                uploadError?.error ||
                "An attachment could not be uploaded."
            );
          }
        }

        const finalizeResponse = await fetch("/api/quote-request/attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.attachmentToken}`,
          },
          body: JSON.stringify({
            projectId: data.projectId,
            attachments: uploads.map(
              (upload: { path: string }, index: number) => ({
                path: upload.path,
                name: attachments[index].name,
                type: attachments[index].type,
                size: attachments[index].size,
              })
            ),
          }),
        });
        if (!finalizeResponse.ok) {
          const finalizeBody = await finalizeResponse.json().catch(() => null);
          throw new Error(
            finalizeBody?.error ||
              "Your quote was saved, but its attachments could not be finalized."
          );
        }
      }

      setSubmitted(true);
      scrollToConfirmation();
    } catch (err) {
      console.error(err);

      if (quoteSaved) {
        const failureDetail =
          process.env.NODE_ENV === "development" && err instanceof Error
            ? ` (${err.message})`
            : "";
        setSubmissionWarning(
          `We received your quote request, but one or more attachments could not be saved. Please mention them when we contact you.${failureDetail}`
        );
        setSubmitted(true);
        scrollToConfirmation();
      } else {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Something went wrong submitting the form. Please try again or call 301-441-4919."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToConfirmation() {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 50);
  }

  function addAttachments(files: File[]) {
    setAttachmentError("");
    const combined = [...attachments];
    for (const file of files) {
      const isDuplicate = combined.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );
      if (!isDuplicate) combined.push(file);
    }

    if (combined.length > QUOTE_ATTACHMENT_MAX_FILES) {
      setAttachmentError(`Choose up to ${QUOTE_ATTACHMENT_MAX_FILES} files.`);
      return;
    }
    if (combined.some((file) => !isAllowedQuoteAttachment(file))) {
      setAttachmentError("Use JPG, PNG, WebP, HEIC, HEIF, or PDF files only.");
      return;
    }
    if (
      combined.some((file) => file.size > QUOTE_ATTACHMENT_MAX_FILE_BYTES)
    ) {
      setAttachmentError("Each file must be 10 MB or smaller.");
      return;
    }
    if (
      combined.reduce((total, file) => total + file.size, 0) >
      QUOTE_ATTACHMENT_MAX_TOTAL_BYTES
    ) {
      setAttachmentError("Attachments must total 30 MB or less.");
      return;
    }
    setAttachments(combined);
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, attachmentIndex) => attachmentIndex !== index)
    );
    setAttachmentError("");
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
                {submissionWarning && (
                  <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    {submissionWarning}
                  </p>
                )}
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
                      onChange={(e) => {
                        const projectType = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          projectType,
                          engineeringServices: requiresEngineeringServices(
                            projectType
                          )
                            ? prev.engineeringServices
                            : "",
                        }));
                      }}
                      onBlur={() => markTouched("projectType")}
                      aria-invalid={Boolean(getFieldError("projectType"))}
                    >
                      <option value="">Choose…</option>
                      {PROJECT_TYPES.map((projectType) => (
                        <option key={projectType} value={projectType}>
                          {projectType}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                  {getFieldError("projectType") && (
                    <p className="mt-2 text-sm text-red-400">
                      {getFieldError("projectType")}
                    </p>
                  )}
                </div>

                {requiresEngineeringServices(form.projectType) && (
                  <div>
                    <label className="block text-white/85 text-sm mb-2">
                      Engineering Services *
                    </label>
                    <div className="relative">
                      <select
                        className={`${inputClass(
                          Boolean(getFieldError("engineeringServices"))
                        )} appearance-none pr-12`}
                        value={form.engineeringServices}
                        onChange={(e) =>
                          setField("engineeringServices", e.target.value)
                        }
                        onBlur={() => markTouched("engineeringServices")}
                        aria-invalid={Boolean(
                          getFieldError("engineeringServices")
                        )}
                      >
                        <option value="">Choose…</option>
                        {ENGINEERING_SERVICES_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                    {getFieldError("engineeringServices") && (
                      <p className="mt-2 text-sm text-red-400">
                        {getFieldError("engineeringServices")}
                      </p>
                    )}
                  </div>
                )}

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
                  <label className="block text-white/85 text-sm mb-2">
                    Project Photos, Drawings, or Plans
                    <span className="ml-2 text-white/50">(Optional)</span>
                  </label>
                  <p className="mb-3 text-sm text-white/60">
                    Supporting files can help us understand your project and
                    provide a more accurate estimate. Upload up to 5 JPG, PNG,
                    WebP, HEIC, or PDF files (10 MB each, 30 MB total).
                  </p>
                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingAttachments(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                      setIsDraggingAttachments(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setIsDraggingAttachments(false);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDraggingAttachments(false);
                      addAttachments(Array.from(event.dataTransfer.files));
                    }}
                    className={`rounded-[10px] border-2 border-dashed px-5 py-7 text-center transition-colors ${
                      isDraggingAttachments
                        ? "border-[#fb5411] bg-[#fb5411]/10"
                        : "border-white/20 bg-black/30"
                    }`}
                  >
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                      onChange={(event) => {
                        addAttachments(
                          Array.from(event.currentTarget.files || [])
                        );
                        event.currentTarget.value = "";
                      }}
                      className="sr-only"
                    />
                    <p className="text-sm font-medium text-white/85">
                      Drag and drop files here
                    </p>
                    <p className="mt-1 text-xs text-white/50">or</p>
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="mt-3 cursor-pointer rounded-lg bg-[#fb5411] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e64d0f]"
                    >
                      Select files
                    </button>
                  </div>
                  {attachments.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm text-white/70">
                      {attachments.map((file, index) => (
                        <li
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                        >
                          <span className="min-w-0 truncate">
                            {file.name}{" "}
                            <span className="text-white/45">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            aria-label={`Remove ${file.name}`}
                            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {attachmentError && (
                    <p className="mt-2 text-sm text-red-400">{attachmentError}</p>
                  )}
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
