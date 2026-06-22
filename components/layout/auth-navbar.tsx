import { createClient } from "@/lib/supabase/server";
import { AuthNavbarClient } from "./auth-navbar-client";

export async function AuthNavbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = user?.email ?? null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name?.trim()) {
      displayName = profile.full_name.trim();
    }
  }

  return <AuthNavbarClient email={user?.email ?? null} displayName={displayName} />;
}
