import "server-only";

type ReviewRequest = {
  recipient: string;
  customerName: string;
};

export async function sendReviewRequestEmail(request: ReviewRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFICATION_FROM_EMAIL?.trim();
  const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: "Email delivery is not configured." };
  }
  if (!reviewUrl) {
    return { ok: false, error: "GOOGLE_REVIEW_URL is not configured." };
  }

  const name = request.customerName.trim() || "there";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: normalizeMailbox(from),
      to: [request.recipient],
      subject: "How did we do? Share your Paradise Ironworks experience",
      text: `Hi ${name},\n\nThank you for choosing Paradise Ironworks & Construction. We hope you are enjoying your completed project. Would you take a moment to share your experience on Google?\n\nLeave a review: ${reviewUrl}\n\nThank you,\nParadise Ironworks & Construction LLC`,
      html: `<div style="font-family:Arial,sans-serif;color:#171717;line-height:1.6"><p>Hi ${escapeHtml(name)},</p><p>Thank you for choosing Paradise Ironworks &amp; Construction. We hope you are enjoying your completed project. Would you take a moment to share your experience on Google?</p><p style="margin:24px 0"><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:12px 18px;background:#fb5411;color:#fff;text-decoration:none;border-radius:8px">Leave a Google review</a></p><p>Thank you,<br>Paradise Ironworks &amp; Construction LLC</p></div>`,
    }),
  });

  if (!response.ok) {
    console.error("Review request email failed:", response.status, await response.text());
    return { ok: false, error: "The review request email could not be sent." };
  }
  return { ok: true };
}

function normalizeMailbox(value: string) {
  return value.includes("<") ? value : `Paradise Ironworks <${value}>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}
