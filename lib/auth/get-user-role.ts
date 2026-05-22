import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "./roles";

const VALID_ROLES: UserRole[] = ["renta", "socio", "admin", "chef"];

function parseRole(value: unknown): UserRole | null {
  if (typeof value === "string" && VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return null;
}

/** Prefer app_metadata.role (JWT), then profiles table */
export function getRoleFromUser(user: User | null): UserRole | null {
  if (!user) return null;
  const fromApp = parseRole(user.app_metadata?.role);
  if (fromApp) return fromApp;
  return null;
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  user: User
): Promise<UserRole> {
  const fromApp = getRoleFromUser(user);
  if (fromApp) return fromApp;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (parseRole(profile?.role) ?? "renta") as UserRole;
}
