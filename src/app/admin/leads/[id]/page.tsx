import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddActivityModal from "@/components/AddActivityModal";

async function addActivity(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const lead_id = String(formData.get("lead_id") || "");
  const activity_type = String(formData.get("activity_type") || "note");
  const summary = String(formData.get("summary") || "");

  if (!lead_id || !summary.trim()) {
    throw new Error("Lead ID and summary are required.");
  }

  const { error } = await supabase.from("lead_activities").insert({
    lead_id,
    activity_type,
    summary,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/admin/leads/${lead_id}`);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  redirect("/login");
}

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    notFound();
  }

  const { data: activities, error: activitiesError } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", id)
    .order("activity_date", { ascending: false });

  if (activitiesError) {
    console.error(activitiesError);
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/leads"
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to leads
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">
          {lead.customer_name}
        </h1>

        <p className="mt-2 text-neutral-400">
          {lead.project_type || "No project type"} · {lead.status || "new"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Lead Details</h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Detail label="Contact Name" value={lead.contact_name} />
            <Detail label="Phone" value={lead.phone} />
            <Detail label="Email" value={lead.email} />
            <Detail label="Source" value={lead.lead_source} />
            <Detail label="Project Address" value={lead.project_address} />
            <Detail label="City" value={lead.city} />
            <Detail label="State" value={lead.state} />
            <Detail label="ZIP Code" value={lead.zip_code} />
            <Detail label="Priority" value={lead.priority} />

            <Detail
              label="Estimated Value"
              value={
                lead.estimated_value
                  ? `$${Number(lead.estimated_value).toLocaleString()}`
                  : null
              }
            />

            <Detail
              label="Last Contacted"
              value={
                lead.last_contacted_at
                  ? new Date(lead.last_contacted_at).toLocaleDateString()
                  : null
              }
            />

            <Detail
              label="Next Follow-Up"
              value={
                lead.next_follow_up_at
                  ? new Date(lead.next_follow_up_at).toLocaleDateString()
                  : null
              }
            />
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Status</h2>

          <div className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
            {lead.status || "new"}
          </div>

          <h2 className="mt-8 text-xl font-semibold">Notes</h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
            {lead.notes || "No notes yet."}
          </p>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Communication Timeline</h2>

          <AddActivityModal projectId={lead.id} action={addActivity} />
        </div>

        <div className="mt-6 space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <p className="font-medium capitalize text-white">
                  {activity.activity_type.replaceAll("_", " ")}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {activity.activity_date
                    ? new Date(activity.activity_date).toLocaleString()
                    : "No date"}
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                  {activity.summary}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">
              No activity history yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-neutral-200">{value || "—"}</p>
    </div>
  );
}