"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { charcuterieItemSchema } from "@/lib/validations/charcuterie-item";
import type { CharcuterieItem } from "@/lib/types/database";

const PATH = "/admin/charcuterie";

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

export async function getCharcuterieItems(): Promise<CharcuterieItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charcuterie_items")
    .select("*")
    .order("category")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CharcuterieItem[];
}

export async function createCharcuterieItem(input: unknown) {
  const parsed = charcuterieItemSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("charcuterie_items")
    .insert(parsed)
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as CharcuterieItem;
}

export async function updateCharcuterieItem(id: string, input: unknown) {
  const parsed = charcuterieItemSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("charcuterie_items")
    .update(parsed)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as CharcuterieItem;
}

export async function deleteCharcuterieItem(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("charcuterie_items").delete().eq("id", id);
  if (error) throw error;
  revalidate();
  return { ok: true };
}
