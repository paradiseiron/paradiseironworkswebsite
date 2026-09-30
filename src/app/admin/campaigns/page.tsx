import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  const { data: campaigns, error } = await createAdminClient().from("email_campaigns").select("id, name, subject, status, created_at, launched_at").order("created_at", { ascending: false });
  if (error) throw error;
  return <div className="mx-auto max-w-6xl">
    <h1 className="text-3xl font-semibold">Email campaigns</h1>
    <p className="mt-2 text-sm text-neutral-400">Create a branded email, preview it, and choose a customer audience.</p>
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03]">
      <h2 className="p-5 text-xl font-semibold">Campaigns</h2>
      {campaigns?.length ? <ul>{campaigns.map((campaign) => <li key={campaign.id} className="border-t border-white/10"><Link href={`/admin/campaigns/${campaign.id}`} className="block p-5 transition hover:bg-white/5"><div className="flex items-center justify-between gap-3"><span className="font-medium text-white">{campaign.name}</span><span className="text-xs capitalize text-neutral-400">{campaign.status}</span></div><p className="mt-1 truncate text-sm text-neutral-400">{campaign.subject}</p></Link></li>)}</ul> : <p className="border-t border-white/10 p-5 text-sm text-neutral-400">No campaigns yet.</p>}
    </section>
  </div>;
}
