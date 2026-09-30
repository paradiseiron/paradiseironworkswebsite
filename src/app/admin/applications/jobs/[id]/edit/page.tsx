import { notFound } from "next/navigation";
import JobPostingForm from "@/components/JobPostingForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireAuthenticatedUser(); await requireAssignedRole(user.id); const { data } = await createAdminClient().from("job_postings").select("*").eq("id", (await params).id).maybeSingle(); if (!data) notFound(); return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-semibold">Edit Job Posting</h1><p className="mt-2 text-neutral-400">Update the position or change its publishing status.</p><JobPostingForm job={data} /></div>; }
