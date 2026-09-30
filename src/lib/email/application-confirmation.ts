export async function sendApplicationConfirmation(input: { email: string; name: string; jobTitle: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "Email service is not configured." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Paradise Ironworks <info@paradiseironworks.com>",
      to: [input.email],
      subject: `We received your application for ${input.jobTitle}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18181b;max-width:620px;margin:auto"><h1 style="font-size:24px">Application received</h1><p>Hi ${escapeHtml(input.name)},</p><p>Thank you for applying for the <strong>${escapeHtml(input.jobTitle)}</strong> position at Paradise Ironworks &amp; Construction. We have received your application and our team will review your qualifications.</p><p>If your experience matches what we are looking for, a member of our team will contact you about next steps.</p><p>Paradise Ironworks &amp; Construction<br><a href="mailto:info@paradiseironworks.com">info@paradiseironworks.com</a></p></div>`,
    }),
  });
  if (!response.ok) return { sent: false, error: await response.text() };
  return { sent: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}
