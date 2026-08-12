import type { Metadata, Viewport } from "next";
import AdminShell from "@/components/AdminShell";
import AdminPwa from "@/components/AdminPwa";
import AdminPushNotifications from "@/components/AdminPushNotifications";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "Paradise Ironworks project and proposal management.",
  manifest: "/admin/manifest.webmanifest",
  icons: {
    apple: "/admin/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Paradise Admin",
    startupImage: [
      {
        url: "/admin/splash/apple-splash-1320x2868.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1206x2622.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1260x2736.png",
        media:
          "(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1284x2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1242x2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1242x2208.png",
        media:
          "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-640x1136.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1668x2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1668x2224.png",
        media:
          "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/admin/splash/apple-splash-1206x2622.png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();
  const role = await requireAssignedRole(user.id);
  const supabase = createAdminClient();
  let projectNotificationCount = 0;

  if (role === "admin") {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("lead_source", "Website")
      .is("website_lead_reviewed_at", null);
    projectNotificationCount = count || 0;
  } else if (role === "estimator" || role === "operations_foreman") {
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("site_visit_status", "ready")
      .eq("site_visit_assigned_to", user.id);
    projectNotificationCount = count || 0;
  }

  return (
    <AdminShell
      userEmail={user.email}
      userRole={role}
      projectNotificationCount={projectNotificationCount}
    >
      {children}
      <AdminPwa />
      <AdminPushNotifications
        publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
        userRole={role}
      />
    </AdminShell>
  );
}
