"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";
import type { UserRole } from "@/lib/roles";

const DISMISSED_KEY = "paradise-admin-push-prompt-dismissed";
export const OPEN_NOTIFICATION_SETTINGS_EVENT =
  "paradise-admin-open-notification-settings";

export default function AdminPushNotifications({
  publicKey,
  userRole,
}: {
  publicKey?: string;
  userRole: UserRole;
}) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userRole === "unassigned") return;

    const timer = window.setTimeout(async () => {
      const canPush =
        "serviceWorker" in navigator &&
        "Notification" in window;
      const wasDismissed =
        window.localStorage.getItem(DISMISSED_KEY) === "true";

      setSupported(canPush);
      setDismissed(wasDismissed);

      if (!canPush) {
        setInitialized(true);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        if (!("pushManager" in registration)) return;
        const existingSubscription =
          await registration.pushManager.getSubscription();
        if (existingSubscription) {
          await saveSubscription(existingSubscription);
          window.localStorage.removeItem(DISMISSED_KEY);
          setDismissed(true);
          setSubscribed(true);
          return;
        }

        setSubscribed(false);
      } catch (initializationError) {
        console.warn(
          "Unable to initialize push notification settings:",
          initializationError
        );
      } finally {
        setInitialized(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [publicKey, userRole]);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(OPEN_NOTIFICATION_SETTINGS_EVENT, openSettings);
    return () =>
      window.removeEventListener(OPEN_NOTIFICATION_SETTINGS_EVENT, openSettings);
  }, []);

  if (userRole === "unassigned") return null;
  if (!initialized || !supported) return null;

  const notificationLabel = getNotificationLabel(userRole);

  if ((dismissed || subscribed) && !settingsOpen) return null;

  async function enableNotifications() {
    setBusy(true);
    setError("");

    try {
      if (!publicKey) {
        throw new Error(
          "Push configuration is unavailable. Verify the VAPID public key and redeploy."
        );
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          "Notifications are blocked. Enable them in iPhone Settings, then try again."
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!("pushManager" in registration)) {
        throw new Error(
          "Push notifications require the Paradise Admin app installed on your Home Screen."
        );
      }
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await saveSubscription(subscription);
      window.localStorage.removeItem(DISMISSED_KEY);
      setSubscribed(true);
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Unable to enable notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
    setSettingsOpen(false);
  }

  async function disableNotifications() {
    setBusy(true);
    setError("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const response = await fetch("/api/admin/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          throw new Error("Unable to disable notifications.");
        }

        await subscription.unsubscribe();
      }

      window.localStorage.setItem(DISMISSED_KEY, "true");
      setSubscribed(false);
      setDismissed(true);
      setSettingsOpen(false);
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Unable to disable notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 z-[60] rounded-2xl border border-white/10 bg-neutral-900 p-4 text-white shadow-2xl md:bottom-6 md:left-auto md:right-6 md:w-[380px]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#fb5411]/15 p-2 text-[#fb5411]">
          {subscribed ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bell className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {subscribed
              ? `${capitalize(notificationLabel)} notifications enabled`
              : `Enable ${notificationLabel} notifications`}
          </p>
          <p className="mt-1 text-sm leading-5 text-neutral-400">
            {subscribed
              ? "This device is registered to receive notifications."
              : getNotificationDescription(userRole)}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification setup"
          className="rounded-lg p-1 text-neutral-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {subscribed ? (
        <button
          type="button"
          onClick={disableNotifications}
          disabled={busy}
          className="mt-4 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-white/5 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Disabling..." : "Disable notifications on this device"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-[#fb5411] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e64d0f] disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Enabling..." : "Enable notifications"}
        </button>
      )}
    </aside>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/admin/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Unable to enable notifications.");
  }
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function getNotificationLabel(userRole: UserRole) {
  if (userRole === "estimator" || userRole === "operations_foreman") {
    return "site visit";
  }
  if (userRole === "viewer") return "viewer";
  return "lead";
}

function getNotificationDescription(userRole: UserRole) {
  if (userRole === "estimator" || userRole === "operations_foreman") {
    return "Get an alert on this device when a project is ready for a site visit.";
  }

  if (userRole === "viewer") {
    return "Allow this device to receive viewer notifications if they are targeted later.";
  }

  return "Get an alert on this device when a website lead arrives.";
}
