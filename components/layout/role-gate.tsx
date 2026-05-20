import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/roles";

interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  locale: string;
  fallback?: string;
}

export async function RoleGate({ children, allowed, locale, fallback }: RoleGateProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "renta") as UserRole;

  if (!allowed.includes(role)) {
    redirect(fallback ?? `/${locale}`);
  }

  return <>{children}</>;
}
