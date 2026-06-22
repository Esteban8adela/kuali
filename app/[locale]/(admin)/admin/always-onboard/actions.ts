"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { alwaysOnboardItemSchema } from "@/lib/validations/always-onboard-item";
import type { AlwaysOnboardItem } from "@/lib/types/database";

const PATH = "/admin/always-onboard";

async function assertAdminWrite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = await resolveUserRole(supabase, user);
  if (!isAdminRole(role) && role !== "chef") throw new Error("Forbidden");
  return supabase;
}

function revalidate() {
  revalidatePath("/", "layout");
  revalidatePath(PATH, "layout");
}

export async function getAlwaysOnboardItems(): Promise<AlwaysOnboardItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("always_onboard_items")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []) as AlwaysOnboardItem[];
}

export async function createAlwaysOnboardItem(input: unknown) {
  const parsed = alwaysOnboardItemSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("always_onboard_items")
    .insert(parsed)
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as AlwaysOnboardItem;
}

export async function updateAlwaysOnboardItem(id: string, input: unknown) {
  const parsed = alwaysOnboardItemSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("always_onboard_items")
    .update(parsed)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as AlwaysOnboardItem;
}

export async function deleteAlwaysOnboardItem(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("always_onboard_items").delete().eq("id", id);
  if (error) throw error;
  revalidate();
  return { ok: true };
}
