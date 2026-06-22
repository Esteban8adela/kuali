import { setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/layout/role-gate";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { ChefSidebar } from "@/components/layout/chef-sidebar";

export default async function ChefLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <RoleGate allowed={["chef", "admin"]} locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <AuthNavbar />
        <div className="flex flex-1 items-start print:block">
          <ChefSidebar locale={locale} />
          <main className="flex-1 bg-[#FAFAF8] p-6 md:ml-56 md:p-10 print:ml-0 print:bg-white print:p-0">
            {children}
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
