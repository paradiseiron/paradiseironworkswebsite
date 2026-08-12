import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);

  redirect(
    role === "bid_estimator" || role === "project_manager"
      ? "/admin/bids"
      : "/admin"
  );
}
