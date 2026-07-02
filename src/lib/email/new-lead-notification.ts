import "server-only";

type NewLeadNotification = {
  projectId: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  projectCategory: string;
  projectType: string;
  comments: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeMailbox(value: string) {
  const unquoted = value
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
  const mailbox = unquoted.match(/^(.*?)<\s*([^<>\s]+@[^<>\s]+)\s*>$/);

  if (!mailbox) return unquoted;

  const name = mailbox[1].trim();
  const email = mailbox[2].trim();
  return name ? `${name} <${email}>` : email;
}

export async function sendNewLeadNotification(lead: NewLeadNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.LEAD_NOTIFICATION_FROM_EMAIL;
  const configuredTo =
    process.env.LEAD_NOTIFICATION_TO_EMAIL || "info@paradiseironworks.com";

  if (!apiKey || !configuredFrom) {
    console.warn(
      "Lead notification email skipped: RESEND_API_KEY or LEAD_NOTIFICATION_FROM_EMAIL is missing."
    );
    return false;
  }

  const from = normalizeMailbox(configuredFrom);
  const to = normalizeMailbox(configuredTo);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.paradiseironworks.com"
  ).replace(/\/$/, "");
  const projectPath = `/admin/projects/${encodeURIComponent(lead.projectId)}`;
  const loginUrl = `${siteUrl}/login?next=${encodeURIComponent(projectPath)}`;
  const comments = lead.comments || "No additional comments provided.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `website-lead-${lead.projectId}`,
      "User-Agent": "Paradise-Ironworks-Website/1.0",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `New website lead: ${lead.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#171717;line-height:1.5">
          <h1 style="font-size:24px">New website lead received</h1>
          <p>A new quote request was submitted through the Paradise Ironworks website.</p>
          <table style="border-collapse:collapse;width:100%;max-width:640px">
            <tbody>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Name</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.name)}</td></tr>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Phone</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.phone)}</td></tr>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Email</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.email)}</td></tr>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">ZIP code</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.zip)}</td></tr>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Category</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.projectCategory)}</td></tr>
              <tr><th style="padding:8px;text-align:left;border-bottom:1px solid #ddd">Project type</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(lead.projectType)}</td></tr>
              <tr><th style="padding:8px;text-align:left;vertical-align:top">Comments</th><td style="padding:8px;white-space:pre-wrap">${escapeHtml(comments)}</td></tr>
            </tbody>
          </table>
          <p style="margin-top:24px">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 18px;background:#fb5411;color:#fff;text-decoration:none;border-radius:8px">
              Log in and review this lead
            </a>
          </p>
        </div>
      `,
      text: [
        "New website lead received",
        "",
        `Name: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Email: ${lead.email}`,
        `ZIP code: ${lead.zip}`,
        `Category: ${lead.projectCategory}`,
        `Project type: ${lead.projectType}`,
        `Comments: ${comments}`,
        "",
        `Log in and review this lead: ${loginUrl}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lead notification email failed:", response.status, errorText);
    return false;
  }

  return true;
}
