import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditProjectForm from "@/components/EditProjectForm";
import { requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireAuthenticatedUser();

  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:rounded-3xl sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Edit Project</h1>

        <p className="mt-2 text-neutral-400">Update project information.</p>

        <EditProjectForm project={project} />
      </div>
    </div>
  );
}
