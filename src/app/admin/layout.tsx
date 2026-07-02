import type { Metadata, Viewport } from "next";
import AdminShell from "@/components/AdminShell";
import AdminPwa from "@/components/AdminPwa";
import AdminPushNotifications from "@/components/AdminPushNotifications";
import { requireAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Paradise Ironworks project and proposal management.",
  manifest: "/admin/manifest.webmanifest",
  icons: {
    apple: "/admin/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Paradise Admin",
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

  return (
    <AdminShell userEmail={user.email}>
      {children}
      <AdminPwa />
      <AdminPushNotifications
        publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
      />
    </AdminShell>
  );
}
