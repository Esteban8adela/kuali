export type UserRole = "renta" | "socio" | "admin" | "chef";

export const GUEST_ROLES: UserRole[] = ["renta", "socio"];
export const STAFF_ROLES: UserRole[] = ["admin", "chef"];

export function isGuestRole(role: UserRole | null | undefined): boolean {
  return role !== null && role !== undefined && GUEST_ROLES.includes(role);
}

export function isChefRole(role: UserRole | null | undefined): boolean {
  return role === "chef" || role === "admin";
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function roleHomePath(role: UserRole, locale: string): string {
  switch (role) {
    case "chef":
      return `/${locale}/chef/dashboard`;
    case "admin":
      return `/${locale}/admin/dashboard`;
    default:
      return `/${locale}/guest/dashboard`;
  }
}
