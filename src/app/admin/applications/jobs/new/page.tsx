import JobPostingForm from "@/components/JobPostingForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
export default async function NewJobPage() { const user = await requireAuthenticatedUser(); await requireAssignedRole(user.id); return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-semibold">New Job Posting</h1><p className="mt-2 text-neutral-400">Create a draft or publish a position to the Careers page.</p><JobPostingForm /></div>; }
