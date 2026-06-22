"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { beverageNamesForDb, beverageSchema } from "@/lib/validations/beverage";
import type { CatalogItemRow } from "@/lib/types/database";

const PATH = "/admin/beverages";

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

function rowFromParsed(parsed: ReturnType<typeof beverageSchema.parse>) {
  const names = beverageNamesForDb(parsed);
  return {
    ...names,
    presentation: parsed.presentation?.trim() || null,
    category: parsed.category,
    subcategory: parsed.subcategory?.trim() || null,
    base_price_cents: parsed.base_price_cents,
    sort_order: parsed.sort_order ?? 0,
    is_active: parsed.is_active ?? true,
  };
}

export async function getBeverages(): Promise<CatalogItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .order("category")
    .order("sort_order")
    .order("name_en");
  if (error) throw error;
  return (data ?? []) as CatalogItemRow[];
}

export async function createBeverage(input: unknown) {
  const parsed = beverageSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("catalog_items")
    .insert(rowFromParsed(parsed))
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as CatalogItemRow;
}

export async function updateBeverage(id: string, input: unknown) {
  const parsed = beverageSchema.parse(input);
  const supabase = await assertAdminWrite();
  const { data, error } = await supabase
    .from("catalog_items")
    .update(rowFromParsed(parsed))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  revalidate();
  return data as CatalogItemRow;
}

export async function deleteBeverage(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("catalog_items").delete().eq("id", id);
  if (error) throw error;
  revalidate();
  return { ok: true };
}
