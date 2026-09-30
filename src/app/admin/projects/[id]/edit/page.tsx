import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditProjectForm from "@/components/EditProjectForm";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { listCustomerNames } from "@/lib/customers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");

  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const customerNames = await listCustomerNames(supabase);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:rounded-3xl sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Edit Project</h1>

        <p className="mt-2 text-neutral-400">Update project information.</p>

        <EditProjectForm project={project} customerNames={customerNames} />
      </div>
    </div>
  );
}
