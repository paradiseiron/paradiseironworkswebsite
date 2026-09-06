type SendBidRfiInput = {
  recipient: string;
  cc: string[];
  projectName: string;
  rfiNumber: number;
  subject: string;
  question: string;
  background?: string | null;
  requestedResponseDate?: string | null;
  attachmentLinks?: Array<{ name: string; url: string }>;
};

export async function sendBidRfiEmail(input: SendBidRfiInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false as const, error: "RFI email is not configured." };
  const dateLine = input.requestedResponseDate ? `<p><strong>Requested response date:</strong> ${escapeHtml(input.requestedResponseDate)}</p>` : "";
  const background = input.background ? `<h3>Background</h3><p>${escapeHtml(input.background).replaceAll("\n", "<br />")}</p>` : "";
  const attachments = input.attachmentLinks?.length ? `<h3>Attachments</h3><ul>${input.attachmentLinks.map((file) => `<li><a href="${escapeHtml(file.url)}">${escapeHtml(file.name)}</a></li>`).join("")}</ul>` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.recipient],
      cc: input.cc.length ? input.cc : undefined,
      subject: `RFI ${input.rfiNumber} – ${input.projectName} – ${input.subject}`,
      html: `<h2>Request for Information ${input.rfiNumber}</h2><p><strong>Project:</strong> ${escapeHtml(input.projectName)}</p><p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>${dateLine}${background}<h3>Question</h3><p>${escapeHtml(input.question).replaceAll("\n", "<br />")}</p>${attachments}`,
    }),
  });
  if (!response.ok) return { ok: false as const, error: "The RFI email could not be sent." };
  return { ok: true as const };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
