import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allowed={["admin"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <AuthNavbar />
        <div className="flex flex-1">
          <AdminSidebar locale={locale} />
          <main className="flex-1 bg-[#FAFAF8] p-6 md:ml-56 md:p-10">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
