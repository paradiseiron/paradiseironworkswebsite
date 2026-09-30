"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveJobPosting(id: string | null, formData: FormData) {
  const user = await requireAuthenticatedUser(); await requireAssignedRole(user.id);
  const title = value(formData, "title"); const slug = value(formData, "slug").toLowerCase(); const status = value(formData, "status");
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Enter a title and a valid lowercase URL slug.");
  if (!["draft", "published", "closed"].includes(status)) throw new Error("Choose a valid status.");
  const payload = { title, slug, status, summary: value(formData, "summary"), description: value(formData, "description"), location: value(formData, "location"), employment_type: value(formData, "employment_type"), compensation: optional(formData, "compensation"), tags: list(formData, "tags", ","), responsibilities: list(formData, "responsibilities", "\n"), qualifications: list(formData, "qualifications", "\n"), published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
  if (!payload.summary || !payload.description || !payload.location || !payload.employment_type) throw new Error("Complete all required job details.");
  const supabase = createAdminClient();
  const result = id ? await supabase.from("job_postings").update(payload).eq("id", id) : await supabase.from("job_postings").insert(payload);
  if (result.error) throw new Error(result.error.code === "23505" ? "That job URL is already in use." : "Unable to save the job posting.");
  revalidatePath("/careers"); revalidatePath(`/careers/${slug}`); revalidatePath("/admin/applications"); redirect("/admin/applications");
}
function value(form: FormData, name: string) { return String(form.get(name) || "").trim(); }
function optional(form: FormData, name: string) { return value(form, name) || null; }
function list(form: FormData, name: string, separator: string) { return value(form, name).split(separator).map((item) => item.trim()).filter(Boolean); }
