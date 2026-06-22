import { setRequestLocale } from "next-intl/server";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { getAdminUsers } from "@/app/[locale]/(admin)/admin/admin-ops-actions";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const users = await getAdminUsers();

  return <AdminUsersManager users={users} />;
}
