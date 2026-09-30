import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationConfirmation } from "@/lib/email/application-confirmation";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 4;
const requestLog = new Map<string, number[]>();
const allowedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"]);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many applications were submitted. Please try again later." }, { status: 429 });
  const form = await request.formData();
  if (text(form, "company_website")) return NextResponse.json({ ok: true });
  const startedAt = Number(form.get("started_at"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 3000 || Date.now() - startedAt > 24 * 60 * 60 * 1000) return NextResponse.json({ error: "Please refresh the page and try again." }, { status: 400 });

  const jobId = text(form, "job_id"); const firstName = text(form, "first_name"); const lastName = text(form, "last_name");
  const email = text(form, "email").toLowerCase(); const phone = text(form, "phone");
  if (!jobId || !firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid name, email address, and phone number." }, { status: 400 });
  if (firstName.length > 80 || lastName.length > 80 || email.length > 254 || phone.length > 40) return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 });
  if (!["yes", "no"].includes(text(form, "work_authorized")) || !["yes", "no"].includes(text(form, "sponsorship_required")) || text(form, "age_confirmed") !== "yes") return NextResponse.json({ error: "Complete the required eligibility questions." }, { status: 400 });

  const resume = file(form.get("resume"));
  const supporting = form.getAll("supporting_documents").map(file).filter((item): item is File => Boolean(item));
  if (!resume) return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
  if (supporting.length > 5) return NextResponse.json({ error: "Attach no more than five supporting documents." }, { status: 400 });
  const documents = [{ file: resume, type: "resume" }, ...supporting.map((item) => ({ file: item, type: "supporting" }))];
  if (documents.some(({ file }) => file.size > 10 * 1024 * 1024 || !allowedTypes.has(file.type) || !/\.(pdf|doc|docx|jpe?g|png)$/i.test(file.name))) return NextResponse.json({ error: "Use PDF, Word, JPG, or PNG files no larger than 10 MB each." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: job } = await supabase.from("job_postings").select("id, title, slug").eq("id", jobId).eq("status", "published").maybeSingle();
  if (!job) return NextResponse.json({ error: "This position is no longer accepting applications." }, { status: 409 });
  const boolean = (name: string) => text(form, name) === "yes";
  const years = text(form, "years_experience");
  const { data: application, error } = await supabase.from("job_applications").insert({
    job_posting_id: job.id, first_name: firstName, last_name: lastName, email, phone,
    address: optional(form, "address"), city: optional(form, "city"), state: optional(form, "state"), postal_code: optional(form, "postal_code"),
    linkedin_url: optional(form, "linkedin_url"), website_url: optional(form, "website_url"), work_authorized: boolean("work_authorized"), sponsorship_required: boolean("sponsorship_required"), age_confirmed: text(form, "age_confirmed") === "yes",
    start_date: optional(form, "start_date"), desired_compensation: optional(form, "desired_compensation"), current_employer: optional(form, "current_employer"), current_title: optional(form, "current_title"), years_experience: years ? Math.max(0, Math.min(60, Number(years))) : null,
    education: limited(form, "education", 4000), skills: limited(form, "skills", 4000), referral_source: limited(form, "referral_source", 500), message: limited(form, "message", 5000),
  }).select("id").single();
  if (error || !application) return NextResponse.json({ error: "Unable to save your application." }, { status: 500 });

  const uploaded: string[] = [];
  try {
    for (const document of documents) {
      const safeName = document.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${application.id}/${randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("job-application-documents").upload(path, document.file, { contentType: document.file.type, upsert: false });
      if (uploadError) throw uploadError; uploaded.push(path);
      const { error: documentError } = await supabase.from("job_application_documents").insert({ application_id: application.id, document_type: document.type, storage_path: path, file_name: document.file.name, content_type: document.file.type, size_bytes: document.file.size });
      if (documentError) throw documentError;
    }
  } catch {
    if (uploaded.length) await supabase.storage.from("job-application-documents").remove(uploaded);
    await supabase.from("job_applications").delete().eq("id", application.id);
    return NextResponse.json({ error: "Unable to upload your application documents." }, { status: 500 });
  }

  const confirmation = await sendApplicationConfirmation({ email, name: firstName, jobTitle: job.title });
  if (!confirmation.sent) console.error("Application confirmation email failed:", confirmation.error);
  return NextResponse.json({ ok: true });
}

function text(form: FormData, name: string) { const value = form.get(name); return typeof value === "string" ? value.trim() : ""; }
function optional(form: FormData, name: string) { return text(form, name) || null; }
function limited(form: FormData, name: string, max: number) { const value = text(form, name); return value ? value.slice(0, max) : null; }
function file(value: FormDataEntryValue | null) { return value instanceof File && value.size > 0 ? value : null; }
function rateLimited(ip: string) { const now = Date.now(); const recent = (requestLog.get(ip) || []).filter((time) => now - time < WINDOW_MS); if (recent.length >= MAX_REQUESTS) return true; recent.push(now); requestLog.set(ip, recent); return false; }
