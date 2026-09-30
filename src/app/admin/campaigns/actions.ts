"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { CUSTOMER_TYPES } from "@/lib/customer-types";
import { campaignConfig, eligibleCustomers } from "@/lib/email/campaigns";
import { CAMPAIGN_ACCENTS, CAMPAIGN_IMAGE_POSITIONS, CAMPAIGN_LAYOUTS, campaignPlainText, renderCampaignEmail, type CampaignImage } from "@/lib/email/campaign-template";

async function requireCampaignAdmin() {
  const user = await requireAuthenticatedUser();
  await requireRole(user.id, "admin");
  return user;
}

export async function saveCampaign(id: string | null, formData: FormData) {
  const user = await requireCampaignAdmin();
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audienceType = String(formData.get("audience_type") || "").trim() || null;
  const postalAddress = String(formData.get("postal_address") || "").trim() || null;
  const headline = String(formData.get("headline") || "").trim() || null;
  const ctaLabel = String(formData.get("cta_label") || "").trim() || null;
  const ctaUrl = String(formData.get("cta_url") || "").trim() || null;
  const layout = String(formData.get("layout") || "centered");
  const imagePosition = String(formData.get("image_position") || "above");
  const accentColor = String(formData.get("accent_color") || "#fb5411");
  if (!CAMPAIGN_LAYOUTS.some((item) => item.value === layout) || !CAMPAIGN_IMAGE_POSITIONS.some((item) => item.value === imagePosition) || !CAMPAIGN_ACCENTS.some((item) => item.value === accentColor)) throw new Error("Invalid campaign layout.");
  if ((ctaLabel || ctaUrl) && (!ctaLabel || !ctaUrl || !/^https:\/\/[^\s]+$/i.test(ctaUrl))) throw new Error("Add both button text and an HTTPS link.");
  if (!name || !subject || !body) throw new Error("Campaign name, subject, and message are required.");
  if (audienceType && !CUSTOMER_TYPES.some((type) => type.value === audienceType)) throw new Error("Invalid customer type.");
  const supabase = createAdminClient();
  const values = { name, subject, body, audience_type: audienceType, postal_address: postalAddress, headline, cta_label: ctaLabel, cta_url: ctaUrl, layout, image_position: imagePosition, accent_color: accentColor, updated_at: new Date().toISOString() };
  if (id) {
    const { data, error } = await supabase.from("email_campaigns").update(values).eq("id", id).eq("status", "draft").select("id").maybeSingle();
    if (error || !data) throw new Error("Only draft campaigns can be edited.");
    redirect(`/admin/campaigns/${id}`);
  }
  const { data, error } = await supabase.from("email_campaigns").insert({ ...values, created_by: user.id }).select("id").single();
  if (error || !data) throw new Error("Unable to save campaign.");
  redirect(`/admin/campaigns/${data.id}`);
}


export async function uploadCampaignImage(id: string, formData: FormData) {
  await requireCampaignAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || !file.size) throw new Error("Choose an image to upload.");
  if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/gif"].includes(file.type)) throw new Error("Use a JPG, PNG, or GIF under 5 MB.");
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const validImage = file.type === "image/jpeg" ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
    : file.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => signature[index] === byte)
    : [71, 73, 70, 56].every((byte, index) => signature[index] === byte);
  if (!validImage) throw new Error("The selected file is not a valid image.");
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("email_campaigns").select("images, status").eq("id", id).maybeSingle();
  if (!campaign || campaign.status !== "draft") throw new Error("Images can only be added to draft campaigns.");
  const images = Array.isArray(campaign.images) ? campaign.images as CampaignImage[] : [];
  if (images.length >= 4) throw new Error("A campaign can contain up to four images.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/gif" ? "gif" : "jpg";
  const path = `${id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("campaign-images").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("Unable to upload image. Check that the campaign images migration has been applied.");
  const { data: publicUrl } = supabase.storage.from("campaign-images").getPublicUrl(path);
  const image = { path, url: publicUrl.publicUrl, alt: String(formData.get("alt") || "").trim() || "Paradise Ironworks project image" };
  const { error } = await supabase.from("email_campaigns").update({ images: [...images, image], updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) {
    await supabase.storage.from("campaign-images").remove([path]);
    throw new Error("Unable to attach image to campaign.");
  }
  redirect(`/admin/campaigns/${id}`);
}

export async function removeCampaignImage(id: string, path: string) {
  await requireCampaignAdmin();
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("email_campaigns").select("images, status").eq("id", id).maybeSingle();
  if (!campaign || campaign.status !== "draft") throw new Error("Images can only be removed from draft campaigns.");
  const images = Array.isArray(campaign.images) ? campaign.images as CampaignImage[] : [];
  if (!images.some((image) => image.path === path)) throw new Error("Image not found in this campaign.");
  const { error } = await supabase.from("email_campaigns").update({ images: images.filter((image) => image.path !== path), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) throw new Error("Unable to remove image from campaign.");
  await supabase.storage.from("campaign-images").remove([path]);
  redirect(`/admin/campaigns/${id}`);
}

export async function launchCampaign(id: string) {
  await requireCampaignAdmin();
  const config = campaignConfig();
  if (!config.apiKey || !config.from) throw new Error("Configure RESEND_API_KEY before launching.");
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("email_campaigns").select("*").eq("id", id).eq("status", "draft").maybeSingle();
  if (!campaign) throw new Error("Campaign is no longer a draft.");
  if (!campaign.postal_address && !config.postalAddress) throw new Error("Add a physical mailing address to the campaign before launching.");
  const customers = await eligibleCustomers(campaign.audience_type);
  if (!customers.length) throw new Error("No eligible customers have an email address in this audience.");
  for (let offset = 0; offset < customers.length; offset += 500) {
    const rows = customers.slice(offset, offset + 500).map((customer) => ({ campaign_id: id, customer_id: customer.id, name: customer.name, email: customer.email.trim().toLowerCase() }));
    const { error } = await supabase.from("email_campaign_recipients").upsert(rows, { onConflict: "campaign_id,email", ignoreDuplicates: true });
    if (error) throw new Error("Unable to prepare campaign recipients.");
  }
  const { error } = await supabase.from("email_campaigns").update({ status: "sending", launched_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) throw new Error("Unable to launch campaign.");
  for (let batch = 0; batch < 10; batch++) {
    if (!(await processBatch(id))) break;
  }
  redirect(`/admin/campaigns/${id}`);
}

export async function sendNextBatch(id: string) {
  await requireCampaignAdmin();
  await processBatch(id);
  redirect(`/admin/campaigns/${id}`);
}

async function processBatch(id: string) {
  const config = campaignConfig();
  if (!config.apiKey || !config.from) throw new Error("Campaign email settings are incomplete.");
  const supabase = createAdminClient();
  const { data: campaign } = await supabase.from("email_campaigns").select("*").eq("id", id).eq("status", "sending").maybeSingle();
  if (!campaign) throw new Error("Campaign is not sending.");
  const postalAddress = campaign.postal_address || config.postalAddress;
  if (!postalAddress) throw new Error("Campaign mailing address is missing.");
  const { data: pending, error: pendingError } = await supabase.from("email_campaign_recipients").select("*").eq("campaign_id", id).eq("status", "pending").order("created_at").order("id").limit(100);
  if (pendingError) throw new Error("Unable to read recipients.");
  if (!pending?.length) {
    await supabase.from("email_campaigns").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    return false;
  }
  // Recheck suppression just before sending, including opt-outs after launch.
  const { data: blocked } = await supabase.from("email_suppressions").select("email").in("email", pending.map((recipient) => recipient.email));
  const suppressed = new Set((blocked || []).map((row) => row.email));
  const recipients = pending.filter((recipient) => !suppressed.has(recipient.email));
  for (const recipient of pending.filter((recipient) => suppressed.has(recipient.email))) {
    await supabase.from("email_campaign_recipients").update({ status: "failed", error: "Unsubscribed" }).eq("id", recipient.id);
  }
  if (recipients.length) {
    const emails = recipients.map((recipient) => {
      const unsubscribe = `${config.siteUrl}/unsubscribe/${recipient.unsubscribe_token}`;
      return {
        from: config.from,
        to: [recipient.email],
        subject: campaign.subject,
        text: campaignPlainText({ ...campaign, postal_address: postalAddress }, unsubscribe),
        html: renderCampaignEmail({ ...campaign, postal_address: postalAddress }, config.siteUrl, unsubscribe),
        headers: { "List-Unsubscribe": `<${unsubscribe}>` },
      };
    });
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `campaign-${id}-batch-${recipients[0].id}` },
      body: JSON.stringify(emails),
    });
    if (!response.ok) throw new Error(`Resend rejected this batch (${response.status}). Retry from the campaign page.`);
    const result = await response.json() as { data?: { id: string }[] };
    if (!Array.isArray(result.data) || result.data.length !== recipients.length) throw new Error("Resend's batch response was incomplete. Check its dashboard before retrying.");
    const now = new Date().toISOString();
    const { error: trackingError } = await supabase.from("email_campaign_recipients").upsert(recipients.map((recipient, index) => ({
      ...recipient, campaign_id: id, status: "accepted", resend_id: result.data![index].id, sent_at: now,
    })), { onConflict: "id" });
    if (trackingError) throw new Error("Emails were accepted, but tracking could not be updated. Retry within 24 hours to avoid duplicates.");
  }
  const { count } = await supabase.from("email_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "pending");
  if (!count) await supabase.from("email_campaigns").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
  return Boolean(count);
}

export async function refreshCampaignTracking(id: string) {
  await requireCampaignAdmin();
  const config = campaignConfig();
  if (!config.apiKey) throw new Error("RESEND_API_KEY is not configured.");
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase.from("email_campaign_recipients").select("id, resend_id, status, email").eq("campaign_id", id).not("resend_id", "is", null).order("last_checked_at", { ascending: true, nullsFirst: true }).limit(20);
  if (error) throw new Error("Unable to load tracking data.");
  const tracked = new Set(["delivered", "opened", "clicked", "bounced", "complained"]);
  for (const row of rows || []) {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(row.resend_id)}`, { headers: { Authorization: `Bearer ${config.apiKey}` }, cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to refresh Resend status (${response.status}).`);
    const data = await response.json() as { last_event?: string };
    const status = data.last_event && tracked.has(data.last_event) ? data.last_event : row.status;
    const { error: updateError } = await supabase.from("email_campaign_recipients").update({ status, last_checked_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) throw new Error("Unable to store updated tracking status.");
    if (status === "bounced" || status === "complained") {
      const { error: suppressionError } = await supabase.from("email_suppressions").upsert({ email: row.email.toLowerCase() }, { onConflict: "email" });
      if (suppressionError) throw new Error("Unable to suppress an undeliverable address.");
    }
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  redirect(`/admin/campaigns/${id}`);
}
