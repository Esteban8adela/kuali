"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "name_required" | "update_failed" };

export async function updateUserProfile(fullName: string): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthorized" };

  const trimmed = fullName.trim();
  if (!trimmed) return { ok: false, error: "name_required" };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", user.id);

  if (profileError) return { ok: false, error: "update_failed" };

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: trimmed },
  });

  if (authError) return { ok: false, error: "update_failed" };

  revalidatePath("/", "layout");
  return { ok: true };
}
