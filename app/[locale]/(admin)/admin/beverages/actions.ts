"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { beverageSchema } from "@/lib/validations/beverage";
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
    .insert({
      ...parsed,
      subcategory: parsed.subcategory?.trim() || null,
    })
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
    .update({
      ...parsed,
      subcategory: parsed.subcategory?.trim() || null,
    })
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
