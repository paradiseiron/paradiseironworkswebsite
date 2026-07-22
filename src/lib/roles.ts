import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole =
  | "admin"
  | "estimator"
  | "operations_foreman"
  | "viewer"
  | "unassigned";

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

  if (
    data?.role === "admin" ||
    data?.role === "estimator" ||
    data?.role === "operations_foreman" ||
    data?.role === "viewer"
  ) {
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
  if (role === "viewer") {
    throw new Error("This action requires a role with write access.");
  }
  return role;
}

export async function requireEstimatorAccess(userId: string) {
  const role = await getUserRole(userId);
  if (role !== "estimator" && role !== "operations_foreman") {
    throw new Error("This action requires estimator access.");
  }
  return role;
}

export function hasEstimatorAccess(role: UserRole) {
  return role === "estimator" || role === "operations_foreman";
}

export async function requireAssignedRole(userId: string) {
  const role = await getUserRole(userId);
  if (role === "unassigned") {
    throw new Error("This account has not been assigned an application role.");
  }
  return role;
}
