import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProjectDetailTabs from "@/components/ProjectDetailTabs";
import FollowUpAlertModal from "@/components/FollowUpAlertModal";
import { resolveFollowUp } from "@/app/admin/projects/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function generateProposalNumber(
  supabase: ReturnType<typeof createAdminClient>,
  projectCategory: string
) {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = projectCategory === "commercial" ? "C" : "R";
  const pattern = `${prefix}-${year}${month}%`;

  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .like("proposal_number", pattern);

  if (error) throw new Error(error.message);

  return `${prefix}-${year}${month}${String((count || 0) + 1).padStart(2, "0")}`;
}

async function updateProjectStatus(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const project_id = String(formData.get("project_id") || "");
  const status = String(formData.get("status") || "lead");

  const updateData: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "lost") updateData.lost_at = new Date().toISOString();
  if (status === "active") updateData.started_at = new Date().toISOString();
  if (status === "completed") updateData.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", project_id);

  if (error) throw new Error(error.message);

  await supabase.from("project_activities").insert({
    project_id,
    activity_type: "status_change",
    summary:
      status === "active"
        ? "Proposal signed. Project moved to active."
        : `Project status changed to ${status}.`,
  });

  redirect(`/admin/projects/${project_id}`);
}

async function updateProposal(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const project_id = String(formData.get("project_id") || "");
  const intent = String(formData.get("intent") || "save");
  const project_category = String(formData.get("project_category") || "");
  const existing_proposal_number = String(
    formData.get("existing_proposal_number") || ""
  );

  const proposal_amount_raw = String(formData.get("proposal_amount") || "");
  const proposal_deposit_raw = String(
    formData.get("proposal_deposit_amount") || ""
  );

  const proposal_amount = proposal_amount_raw ? Number(proposal_amount_raw) : null;
  const proposal_deposit_amount = proposal_deposit_raw
    ? Number(proposal_deposit_raw)
    : null;

  const proposal_number =
    proposal_amount && !existing_proposal_number
      ? await generateProposalNumber(supabase, project_category)
      : existing_proposal_number || null;

  const { error } = await supabase
    .from("projects")
    .update({
      proposal_number,
      proposal_amount,
      proposal_project_name: String(formData.get("proposal_project_name") || ""),
      proposal_attention: String(formData.get("proposal_attention") || ""),
      proposal_office_phone: String(formData.get("proposal_office_phone") || ""),
      proposal_cell_phone: String(formData.get("proposal_cell_phone") || ""),
      proposal_email: String(formData.get("proposal_email") || ""),
      proposal_intro: String(formData.get("proposal_intro") || ""),
      proposal_scope: String(formData.get("proposal_scope") || ""),
      proposal_finish: String(formData.get("proposal_finish") || ""),
      proposal_exclusions: String(formData.get("proposal_exclusions") || ""),
      proposal_pricing: String(formData.get("proposal_pricing") || ""),
      proposal_deposit_amount,
      proposal_payment_terms: String(formData.get("proposal_payment_terms") || ""),
      proposal_schedule: String(formData.get("proposal_schedule") || ""),
      proposal_clarifications: String(formData.get("proposal_clarifications") || ""),
      proposal_prepared_by: String(formData.get("proposal_prepared_by") || ""),
      proposal_prepared_by_title: String(
        formData.get("proposal_prepared_by_title") || ""
      ),
      proposal_updated_at: new Date().toISOString(),
      proposal_sent_at: proposal_amount ? new Date().toISOString() : null,
      status: proposal_amount ? "quoted" : "lead",
      updated_at: new Date().toISOString(),
    })
    .eq("id", project_id);

  if (error) throw new Error(error.message);

  await supabase.from("project_activities").insert({
    project_id,
    activity_type: proposal_number ? "proposal_sent" : "status_change",
    summary: proposal_number
      ? `Proposal ${proposal_number} updated.`
      : "Proposal draft updated.",
  });

  if (intent === "preview") {
    redirect(`/admin/projects/${project_id}/proposal`);
  }

  redirect(`/admin/projects/${project_id}?tab=proposal`);
}

async function addProjectActivity(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const project_id = String(formData.get("project_id") || "");
  const activity_type = String(formData.get("activity_type") || "note");
  const summary = String(formData.get("summary") || "");

  const requires_follow_up = formData.get("requires_follow_up") === "on";
  const follow_up_note = String(formData.get("follow_up_note") || "");
  const follow_up_due_at_raw = String(formData.get("follow_up_due_at") || "");
  const follow_up_due_at = follow_up_due_at_raw || null;

  if (!project_id || !summary.trim()) {
    throw new Error("Project ID and summary are required.");
  }

  const { error: activityError } = await supabase
    .from("project_activities")
    .insert({
      project_id,
      activity_type,
      summary,
      requires_follow_up,
      follow_up_note: requires_follow_up ? follow_up_note : null,
      follow_up_due_at: requires_follow_up ? follow_up_due_at : null,
    });

  if (activityError) throw new Error(activityError.message);

  const { error: projectError } = await supabase
    .from("projects")
    .update({
      has_open_follow_up: requires_follow_up,
      latest_follow_up_note: requires_follow_up
        ? follow_up_note || summary || "Follow-up required"
        : null,
      latest_follow_up_due_at: requires_follow_up ? follow_up_due_at : null,
      next_follow_up_at: requires_follow_up ? follow_up_due_at : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project_id);

  if (projectError) throw new Error(projectError.message);

  redirect(`/admin/projects/${project_id}`);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const authSupabase = await createClient();

 const {
  data: { session },
} = await authSupabase.auth.getSession();

if (!session) redirect("/login");

  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  const { data: activities, error: activitiesError } = await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", id)
    .order("activity_date", { ascending: false });

  if (activitiesError) {
    console.error(
      "Error loading project activities:",
      JSON.stringify(activitiesError, null, 2)
    );
  }

  return (
    <div>
      <div className="mt-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{project.customer_name}</h1>

          <p className="mt-2 text-neutral-400">
            {project.project_category} · {project.project_type || "No type"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {project.has_open_follow_up === true && (
            <FollowUpAlertModal
              projectId={project.id}
              note={project.latest_follow_up_note}
              dueAt={project.latest_follow_up_due_at}
              returnPath={`/admin/projects/${project.id}`}
              action={resolveFollowUp}
            />
          )}

          <span
            className={`rounded-full border px-4 py-2 text-sm capitalize ${getStatusStyles(
              project.status
            )}`}
          >
            {project.status || "lead"}
          </span>
        </div>
      </div>

      <ProjectDetailTabs
        project={project}
        activities={activities || []}
        updateProjectStatus={updateProjectStatus}
        updateProposal={updateProposal}
        addProjectActivity={addProjectActivity}
      />
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