import "server-only";

import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/roles";

type WorkflowNotification = {
  recipientRole: Exclude<UserRole, "unassigned">;
  recipientUserIds?: string[];
  title: string;
  body: string;
  emailSubject: string;
  url: string;
  tag: string;
};

export async function sendWorkflowNotification(
  notification: WorkflowNotification
) {
  const supabase = createAdminClient();
  let recipientsQuery = supabase
    .from("user_roles")
    .select("user_id, notification_email")
    .eq("role", notification.recipientRole);

  if (notification.recipientUserIds?.length) {
    recipientsQuery = recipientsQuery.in(
      "user_id",
      notification.recipientUserIds
    );
  }

  const { data: roleUsers, error } = await recipientsQuery;

  if (error) {
    console.error("Unable to load notification recipients:", error);
    return false;
  }

  const userIds = (roleUsers || []).map((user) => user.user_id);
  const emails = (roleUsers || [])
    .map((user) => user.notification_email?.trim())
    .filter((email): email is string => Boolean(email));

  const [emailSent, pushSent] = await Promise.all([
    sendEmail(emails, notification),
    sendPush(userIds, notification),
  ]);

  return emailSent && pushSent;
}

async function sendEmail(
  recipients: string[],
  notification: WorkflowNotification
) {
  if (!recipients.length) return true;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFICATION_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.paradiseironworks.com"
  ).replace(/\/$/, "");
  const destination = `${siteUrl}${notification.url}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: normalizeMailbox(from),
      to: recipients,
      subject: notification.emailSubject,
      text: `${notification.body}\n\nOpen project: ${destination}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#171717;line-height:1.5">
          <h1 style="font-size:24px">${escapeHtml(notification.title)}</h1>
          <p>${escapeHtml(notification.body)}</p>
          <p style="margin-top:24px">
            <a href="${destination}" style="display:inline-block;padding:12px 18px;background:#fb5411;color:#fff;text-decoration:none;border-radius:8px">
              Open project
            </a>
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    console.error(
      "Workflow email notification failed:",
      response.status,
      await response.text()
    );
  }
  return response.ok;
}

async function sendPush(
  userIds: string[],
  notification: WorkflowNotification
) {
  if (!userIds.length) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@paradiseironworks.com",
    publicKey,
    privateKey
  );

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) return false;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    tag: notification.tag,
  });

  const results = await Promise.allSettled(
    (data || []).map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
      } catch (pushError) {
        const statusCode =
          pushError &&
          typeof pushError === "object" &&
          "statusCode" in pushError
            ? Number(pushError.statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("admin_push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          return;
        }
        throw pushError;
      }
    })
  );

  return results.every((result) => result.status === "fulfilled");
}

function normalizeMailbox(value: string) {
  return value
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
