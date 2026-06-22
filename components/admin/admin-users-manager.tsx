"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { updateUserRole, type AdminUserRow } from "@/app/[locale]/(admin)/admin/admin-ops-actions";
import type { UserRole } from "@/lib/auth/roles";

const ROLE_OPTIONS: UserRole[] = ["renta", "socio", "chef", "admin"];

interface AdminUsersManagerProps {
  users: AdminUserRow[];
}

export function AdminUsersManager({ users: initialUsers }: AdminUsersManagerProps) {
  const t = useTranslations("admin.usersPage");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialUsers;
    return initialUsers.filter(
      (user) =>
        (user.full_name?.toLowerCase().includes(q) ?? false) ||
        (user.email?.toLowerCase().includes(q) ?? false) ||
        user.role.toLowerCase().includes(q)
    );
  }, [initialUsers, query]);

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      await updateUserRole(userId, role);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
              <th className="p-3 font-medium">{t("columns.name")}</th>
              <th className="p-3 font-medium">{t("columns.email")}</th>
              <th className="p-3 font-medium">{t("columns.role")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-neutral-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                  <td className="p-3 font-medium text-[#1B3A4B]">
                    {user.full_name ?? user.id.slice(0, 8)}
                  </td>
                  <td className="p-3 text-neutral-600">{user.email ?? "—"}</td>
                  <td className="p-3">
                    <select
                      className="rounded-md border border-input bg-white px-2 py-1.5 text-sm"
                      value={user.role}
                      disabled={pending}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {t(`roles.${role}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
