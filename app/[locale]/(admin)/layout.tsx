import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await resolveUserRole(supabase, user) : "admin";
  const sidebarMode = role === "chef" ? "catalog" : "full";

  return (
    <RoleGate allowed={["admin", "chef"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <AuthNavbar />
        <div className="flex flex-1">
          <AdminSidebar locale={locale} mode={sidebarMode} />
          <main className="flex-1 bg-[#FAFAF8] p-6 md:ml-56 md:p-10">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
