import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import EditProjectForm from "@/components/EditProjectForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

const authSupabase = await createClient();

const {
  data: { session },
} = await authSupabase.auth.getSession();

if (!session) {
  redirect("/login");
}

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
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <h1 className="text-3xl font-semibold">Edit Project</h1>

        <p className="mt-2 text-neutral-400">Update project information.</p>

        <EditProjectForm project={project} />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">{label}</label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue || ""}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-[#fb5411]"
      />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">{label}</label>

      <div className="relative">
        <select
          name={name}
          defaultValue={defaultValue || ""}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-12 text-white outline-none focus:border-[#fb5411]"
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">
          ⌄
        </div>
      </div>
    </div>
  );
}