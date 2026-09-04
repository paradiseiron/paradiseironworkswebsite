import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole =
  | "admin"
  | "estimator"
  | "operations_foreman"
  | "bid_estimator"
  | "project_manager"
  | "viewer"
  | "unassigned";

export const getUserRole = cache(async function getUserRole(
  userId: string
): Promise<UserRole> {
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
    data?.role === "bid_estimator" ||
    data?.role === "project_manager" ||
    data?.role === "viewer"
  ) {
    return data.role;
  }
  return "unassigned";
});

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
  if (
    role !== "admin" &&
    role !== "estimator" &&
    role !== "operations_foreman"
  ) {
    throw new Error("This action requires a role with write access.");
  }
  return role;
}

export async function requireSiteVisitWriteRole(userId: string) {
  const role = await getUserRole(userId);
  if (role === "unassigned") {
    throw new Error("This account has not been assigned an application role.");
  }
  if (role === "viewer") {
    throw new Error("Read-only users cannot change site visit details.");
  }
  return role;
}

export async function requireBidWriteRole(userId: string) {
  const role = await getUserRole(userId);
  if (
    role !== "admin" &&
    role !== "bid_estimator" &&
    role !== "project_manager"
  ) {
    throw new Error("This action requires Commercial Bid write access.");
  }
  return role;
}

export function hasBidWriteAccess(role: UserRole) {
  return (
    role === "admin" ||
    role === "bid_estimator" ||
    role === "project_manager"
  );
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
