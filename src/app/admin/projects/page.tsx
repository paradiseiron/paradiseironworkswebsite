import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const authSupabase = await createClient();

  const {
  data: { session },
} = await authSupabase.auth.getSession();

if (!session) redirect("/login");

  const supabase = createAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("received_at", { ascending: false });

  if (error) {
  console.error("Error loading projects:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(error.message || "Failed to load projects");
}
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>

          <p className="mt-2 text-neutral-400">
            Track jobs from lead through proposal, production, completion, and
            invoice.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1500px] text-left text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Project Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow-Up</th>
              <th className="px-4 py-3">Proposal #</th>
              <th className="px-4 py-3">Proposal Amount</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Next Follow-Up</th>
              <th className="px-4 py-3">Balance Due</th>
            </tr>
          </thead>

          <tbody>
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-neutral-300">
                    {project.received_at
                      ? new Date(project.received_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="hover:text-[#fb5411]"
                    >
                      {project.customer_name}
                    </Link>
                  </td>

                  <td className="px-4 py-3 capitalize text-neutral-300">
                    {project.project_category || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.project_type || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs capitalize ${getStatusStyles(
                        project.status
                      )}`}
                    >
                      {project.status || "lead"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {project.has_open_follow_up ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span>Needs Follow-Up</span>
                      </div>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.proposal_number || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.proposal_amount
                      ? `$${Number(project.proposal_amount).toLocaleString()}`
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.lead_source || "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.next_follow_up_at
                      ? new Date(project.next_follow_up_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-neutral-300">
                    {project.balance_due
                      ? `$${Number(project.balance_due).toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-neutral-400" colSpan={11}>
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusStyles(status?: string | null) {
  switch (status) {
    case "lead":
      return "border-white/10 bg-white/5 text-white";
    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    case "quoted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "completed":
      return "border-green-500/20 bg-green-500/10 text-green-300";
    case "lost":
      return "border-neutral-500/20 bg-neutral-500/10 text-neutral-400";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
}