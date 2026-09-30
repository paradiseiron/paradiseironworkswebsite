import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerTypeLabel } from "@/lib/customer-types";
import Image from "next/image";
import CampaignComposer from "@/components/CampaignComposer";
import type { CampaignImage } from "@/lib/email/campaign-template";
import { campaignConfig, eligibleCustomers } from "@/lib/email/campaigns";
import { launchCampaign, refreshCampaignTracking, removeCampaignImage, saveCampaign, sendNextBatch, uploadCampaignImage } from "../actions";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign) notFound();
  const audience = campaign.status === "draft" ? await eligibleCustomers(campaign.audience_type) : [];
  const recipients: { id: string; name: string; email: string; status: string; error: string | null; sent_at: string | null }[] = [];
  if (campaign.status !== "draft") {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("email_campaign_recipients").select("id, name, email, status, error, sent_at").eq("campaign_id", id).order("created_at").range(offset, offset + 999);
      if (error) throw error;
      recipients.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
  }
  const counts = Object.fromEntries(["pending", "accepted", "delivered", "opened", "clicked", "bounced", "complained", "failed"].map((status) => [status, recipients?.filter((row) => row.status === status).length || 0]));
  const config = campaignConfig();
  const images = Array.isArray(campaign.images) ? campaign.images as CampaignImage[] : [];
  const launchReady = Boolean(config.apiKey && config.from && (campaign.postal_address || config.postalAddress));
  return <div className="mx-auto max-w-5xl">
    <Link href="/admin/campaigns" className="text-sm text-neutral-400 hover:text-white">← Back to campaigns</Link>
    <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">{campaign.name}</h1><p className="mt-2 text-sm text-neutral-400">{campaign.status} · {campaign.audience_type ? customerTypeLabel(campaign.audience_type) : "All customer types"}</p></div>
      {campaign.status === "draft" && <form action={launchCampaign.bind(null, id)}><button disabled={!launchReady || !audience.length} className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Launch to {audience.length} customers</button></form>}
      {campaign.status === "sending" && <form action={sendNextBatch.bind(null, id)}><button className="rounded-xl bg-[#fb5411] px-5 py-3 text-sm font-semibold text-white">Send next 100</button></form>}
    </div>
    {campaign.status !== "draft" && <form action={refreshCampaignTracking.bind(null, id)} className="mt-4"><button className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Refresh delivery tracking (20 at a time)</button></form>}
    {!launchReady && campaign.status === "draft" && <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">Set RESEND_API_KEY and add a physical mailing address below to enable launch. The address appears in every message footer.</p>}
    {campaign.status === "draft" ? <div className="mt-8 space-y-6">
      <CampaignComposer action={saveCampaign.bind(null, id)} draft={{ ...campaign, images, postal_address: campaign.postal_address || config.postalAddress || "" }} siteUrl={config.siteUrl} submitLabel="Save changes" />
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xl font-semibold">Campaign images</h2>
        <p className="mt-1 text-sm text-neutral-400">Add up to four JPG, PNG, or GIF images. They appear in the preview after upload.</p>
        {images.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{images.map((image) => <div key={image.path} className="rounded-xl border border-white/10 p-3"><Image src={image.url} alt={image.alt} width={240} height={150} unoptimized className="h-32 w-full rounded-lg object-cover" /><p className="mt-2 truncate text-xs text-neutral-300">{image.alt}</p><form action={removeCampaignImage.bind(null, id, image.path)} className="mt-2"><button className="text-xs text-red-300 hover:text-red-200">Remove image</button></form></div>)}</div>}
        {images.length < 4 && <form action={uploadCampaignImage.bind(null, id)} className="mt-5 flex flex-wrap items-end gap-4"><label className="text-sm text-neutral-300">Image<input name="image" type="file" accept="image/jpeg,image/png,image/gif" required className="mt-2 block max-w-64 text-xs" /></label><label className="text-sm text-neutral-300">Image description<input name="alt" maxLength={160} placeholder="Describe the image" className="mt-2 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" /></label><button className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white">Add image</button></form>}
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-xl font-semibold">Audience preview</h2><p className="mt-2 text-sm text-neutral-400">{audience.length} customers with valid email addresses, excluding unsubscribed addresses and duplicate emails.</p><ul className="mt-4 max-h-96 overflow-y-auto text-sm">{audience.slice(0, 100).map((customer) => <li key={customer.id} className="border-t border-white/10 py-2"><span className="text-white">{customer.name}</span><span className="ml-2 text-neutral-400">{customer.email}</span></li>)}</ul>{audience.length > 100 && <p className="mt-2 text-xs text-neutral-400">Showing the first 100.</p>}</section>
    </div> : <><section className="mt-8 grid gap-4 sm:grid-cols-3">{Object.entries(counts).map(([label, count]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-sm capitalize text-neutral-400">{label}</p><p className="mt-2 text-3xl font-semibold">{count}</p></div>)}</section><section className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr><th className="p-4">Customer</th><th className="p-4">Email</th><th className="p-4">Status</th></tr></thead><tbody>{recipients?.map((recipient) => <tr key={recipient.id} className="border-t border-white/10"><td className="p-4">{recipient.name}</td><td className="p-4">{recipient.email}</td><td className="p-4 capitalize">{recipient.status}{recipient.error ? ` · ${recipient.error}` : ""}</td></tr>)}</tbody></table></section></>}
  </div>;
}

