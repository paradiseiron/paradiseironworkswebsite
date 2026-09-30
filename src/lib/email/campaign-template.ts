export const CAMPAIGN_ACCENTS = [
  { value: "#fb5411", label: "Paradise orange" },
  { value: "#1d4d65", label: "Steel blue" },
  { value: "#1f2937", label: "Charcoal" },
] as const;
export const CAMPAIGN_LAYOUTS = [
  { value: "centered", label: "Centered" },
  { value: "left", label: "Left aligned" },
] as const;
export const CAMPAIGN_IMAGE_POSITIONS = [
  { value: "above", label: "Above message" },
  { value: "below", label: "Below message" },
] as const;

export type CampaignImage = { path: string; url: string; alt: string };
export type CampaignDesign = {
  headline?: string | null;
  body: string;
  layout?: string | null;
  image_position?: string | null;
  accent_color?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  images?: CampaignImage[] | null;
  postal_address?: string | null;
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function renderCampaignEmail(design: CampaignDesign, siteUrl: string, unsubscribeUrl: string) {
  const accent = CAMPAIGN_ACCENTS.find((item) => item.value === design.accent_color)?.value || "#fb5411";
  const align = design.layout === "left" ? "left" : "center";
  const imagePosition = design.image_position === "below" ? "below" : "above";
  const images = (design.images || []).filter((image) => /^https:\/\//.test(image.url)).slice(0, 4);
  const imageHtml = images.map((image) => `<tr><td style="padding:0 32px 20px"><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || "Campaign image")}" width="536" style="display:block;width:100%;height:auto;border-radius:10px;border:0"></td></tr>`).join("");
  const safeCtaUrl = design.cta_url && /^https:\/\//i.test(design.cta_url) ? design.cta_url : null;
  const cta = safeCtaUrl && design.cta_label ? `<tr><td align="${align}" style="padding:8px 32px 32px"><a href="${escapeHtml(safeCtaUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:8px">${escapeHtml(design.cta_label)}</a></td></tr>` : "";
  const paragraphs = design.body.trim().split(/\n\s*\n/).map((paragraph) => `<p style="margin:0 0 18px;white-space:pre-line">${escapeHtml(paragraph)}</p>`).join("");
  const logoUrl = `${siteUrl.replace(/\/$/, "")}/images/paradise_ironworks_logo.png`;
  const address = escapeHtml(design.postal_address || "Mailing address will appear here").replace(/\n/g, "<br>");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#f2f3f4;font-family:Arial,sans-serif;color:#1f2937"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="height:6px;background:${accent}"></td></tr><tr><td align="${align}" style="padding:30px 32px 22px"><img src="${escapeHtml(logoUrl)}" width="84" alt="Paradise Ironworks & Construction" style="display:block;width:84px;height:84px;margin:${align === "center" ? "0 auto" : "0"};border:0"><div style="margin-top:12px;color:#171717;font-size:17px;font-weight:700;letter-spacing:.02em">Paradise Ironworks &amp; Construction</div></td></tr>${imagePosition === "above" ? imageHtml : ""}${design.headline ? `<tr><td align="${align}" style="padding:0 32px 18px;font-size:27px;line-height:1.25;font-weight:700;color:#171717">${escapeHtml(design.headline)}</td></tr>` : ""}<tr><td align="${align}" style="padding:0 32px 12px;font-size:16px;line-height:1.65">${paragraphs}</td></tr>${imagePosition === "below" ? imageHtml : ""}${cta}<tr><td style="padding:22px 32px;background:#f7f7f7;border-top:1px solid #e5e7eb;color:#666;font-size:12px;line-height:1.6">Promotional email from Paradise Ironworks &amp; Construction LLC<br>${address}<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:${accent}">Unsubscribe from marketing emails</a></td></tr></table></td></tr></table></body></html>`;
}

export function campaignPlainText(design: CampaignDesign, unsubscribeUrl: string) {
  return [design.headline, design.body, design.cta_label && design.cta_url ? `${design.cta_label}: ${design.cta_url}` : null, `Promotional email from Paradise Ironworks & Construction LLC\n${design.postal_address || ""}\nUnsubscribe: ${unsubscribeUrl}`].filter(Boolean).join("\n\n");
}
