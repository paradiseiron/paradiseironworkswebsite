import { createAdminClient } from "@/lib/supabase/admin";

export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  location: string;
  employment_type: string;
  compensation: string | null;
  tags: string[];
  published_at: string | null;
};

const JOB_FIELDS = "id, slug, title, summary, description, responsibilities, qualifications, location, employment_type, compensation, tags, published_at";

export async function getPublishedJobs() {
  const { data, error } = await createAdminClient()
    .from("job_postings")
    .select(JOB_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Unable to load job postings:", error.message);
    return [] as JobPosting[];
  }
  return (data || []) as JobPosting[];
}

export async function getPublishedJob(slug: string) {
  const { data, error } = await createAdminClient()
    .from("job_postings")
    .select(JOB_FIELDS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  return data as JobPosting | null;
}

export async function hasPublishedJobs() {
  const { count, error } = await createAdminClient()
    .from("job_postings")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return !error && Boolean(count);
}

export function jobTypeLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
