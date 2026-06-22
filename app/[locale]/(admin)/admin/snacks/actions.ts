"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { snackSchema } from "@/lib/validations/snack";
import type { Snack } from "@/lib/types/database";

const SNACKS_PATH = "/admin/snacks";

async function assertAdminWrite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = await resolveUserRole(supabase, user);
  if (!isAdminRole(role) && role !== "chef") {
    throw new Error("Forbidden");
  }
  return supabase;
}

function revalidateSnacks() {
  revalidatePath("/", "layout");
  revalidatePath(SNACKS_PATH, "layout");
}

function snackRow(parsed: ReturnType<typeof snackSchema.parse>) {
  const primaryName = parsed.name_es;
  return {
    name: primaryName,
    name_en: parsed.name_en,
    name_es: parsed.name_es,
    description_en: parsed.description_en?.trim() || null,
    description_es: parsed.description_es?.trim() || null,
    category: parsed.category ?? "general",
    base_price_cents: parsed.base_price_cents,
    sort_order: parsed.sort_order ?? 0,
    is_active: parsed.is_active ?? true,
  };
}

export async function getSnacks(): Promise<Snack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("snacks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Snack[];
}

export async function createSnack(input: unknown) {
  const parsed = snackSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data, error } = await supabase
    .from("snacks")
    .insert(snackRow(parsed))
    .select("*")
    .single();

  if (error) throw error;
  revalidateSnacks();
  return data as Snack;
}

export async function updateSnack(id: string, input: unknown) {
  const parsed = snackSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data, error } = await supabase
    .from("snacks")
    .update(snackRow(parsed))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  revalidateSnacks();
  return data as Snack;
}

export async function deleteSnack(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("snacks").delete().eq("id", id);
  if (error) throw error;
  revalidateSnacks();
  return { ok: true };
}
