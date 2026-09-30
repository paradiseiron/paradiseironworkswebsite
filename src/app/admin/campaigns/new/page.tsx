import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { campaignConfig } from "@/lib/email/campaigns";
import CampaignComposer from "@/components/CampaignComposer";
import { saveCampaign } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  const config = campaignConfig();
  return <div className="mx-auto max-w-6xl">
    <h1 className="text-2xl font-semibold sm:text-3xl">New Campaign</h1>
    <p className="mt-2 text-neutral-400">Create a branded email and preview it before saving the draft.</p>
    <p className="mt-5 text-sm text-neutral-400">Save the draft to add images. You can review the complete email before launch.</p>
    <div className="mt-6"><CampaignComposer action={saveCampaign.bind(null, null)} draft={{ body: "", postal_address: config.postalAddress || "" }} siteUrl={config.siteUrl} formId="new-campaign-form" showSubmit={false} /></div>
  </div>;
}
