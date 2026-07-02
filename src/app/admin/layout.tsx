import type { Metadata, Viewport } from "next";
import AdminShell from "@/components/AdminShell";
import AdminPwa from "@/components/AdminPwa";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getProposalRenderProjectId } from "@/lib/proposal-render-auth";

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
  const renderProjectId = await getProposalRenderProjectId();
  const user = renderProjectId ? null : await requireAuthenticatedUser();

  return (
    <AdminShell userEmail={user?.email}>
      {children}
      <AdminPwa />
    </AdminShell>
  );
}
