import "server-only";

import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type LeadPush = {
  projectId: string;
  name: string;
  projectType: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendNewLeadPushNotification(lead: LeadPush) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT || "mailto:info@paradiseironworks.com";

  if (!publicKey || !privateKey) {
    console.warn(
      "Lead push notification skipped: VAPID keys are not configured."
    );
    return false;
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createAdminClient();
  const { data: admins, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (roleError || !admins?.length) {
    console.error("Unable to load admin push recipients:", roleError);
    return false;
  }

  const { data, error } = await supabase
    .from("admin_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in(
      "user_id",
      admins.map((admin) => admin.user_id)
    );

  if (error) {
    console.error("Unable to load push subscriptions:", error);
    return false;
  }

  const subscriptions = (data || []) as StoredSubscription[];
  if (!subscriptions.length) return true;

  const payload = JSON.stringify({
    title: "New website lead",
    body: `${lead.name} submitted a ${lead.projectType || "project"} request.`,
    url: `/admin/projects/${encodeURIComponent(lead.projectId)}`,
    tag: `website-lead-${lead.projectId}`,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
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

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) {
    console.error(
      `Lead push notification failed for ${failures.length} subscription(s).`,
      failures
    );
  }

  return failures.length === 0;
}
