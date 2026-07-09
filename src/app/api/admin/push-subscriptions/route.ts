import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalRole } from "@/lib/roles";

type PushSubscriptionBody = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const subscription = (await request.json()) as PushSubscriptionBody;

  if (
    !subscription.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys.auth
  ) {
    return NextResponse.json(
      { error: "Invalid push subscription." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: request.headers.get("user-agent"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Push subscription save failed:", error);
    return NextResponse.json(
      { error: "Unable to enable push notifications." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  await requireAuthenticatedUser();
  const body = (await request.json()) as { endpoint?: string };

  if (!body.endpoint) {
    return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error) {
    return NextResponse.json(
      { error: "Unable to disable push notifications." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
