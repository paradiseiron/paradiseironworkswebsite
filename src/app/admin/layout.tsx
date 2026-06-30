import AdminShell from "@/components/AdminShell";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
