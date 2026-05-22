import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { roleHomePath, type UserRole } from "@/lib/auth/roles";

interface RoleGateProps {
  children: React.ReactNode;
  allowed: UserRole[];
  locale: string;
}

export async function RoleGate({ children, allowed, locale }: RoleGateProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const role = await resolveUserRole(supabase, user);

  if (!allowed.includes(role)) {
    redirect(roleHomePath(role, locale));
  }

  return <>{children}</>;
}
