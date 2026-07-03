import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = "admin" | "estimator" | "unassigned";

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load user role:", error);
    return "unassigned";
  }

  if (data?.role === "admin" || data?.role === "estimator") {
    return data.role;
  }
  return "unassigned";
}

export async function requireRole(
  userId: string,
  requiredRole: Exclude<UserRole, "unassigned">
) {
  const role = await getUserRole(userId);
  if (role !== requiredRole) {
    throw new Error(`This action requires the ${requiredRole} role.`);
  }
  return role;
}

export async function requireOperationalRole(userId: string) {
  const role = await getUserRole(userId);
  if (role === "unassigned") {
    throw new Error("This account has not been assigned an application role.");
  }
  return role;
}
