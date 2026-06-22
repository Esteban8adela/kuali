"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import { ingredientSchema } from "@/lib/validations/ingredient";
import { dishWithRecipeSchema, recipeLinesToPerPax } from "@/lib/validations/dish";
import type { DishWithRecipe, Ingredient } from "@/lib/types/database";

const CATALOG_PATH = "/admin/catalog";

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

function revalidateCatalog() {
  revalidatePath("/", "layout");
  revalidatePath(CATALOG_PATH, "layout");
}

function normalizeImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mapDishRow(row: Record<string, unknown>): DishWithRecipe {
  const rawLines = (row.dish_ingredients as Array<Record<string, unknown>>) ?? [];
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    category: row.category as string,
    image_url: (row.image_url as string | null) ?? null,
    recipe_yield: Number(row.recipe_yield ?? 1),
    base_price_cents: Number(row.base_price_cents ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    recipe: rawLines.map((line) => ({
      ingredient_id: line.ingredient_id as string,
      quantity_per_pax: Number(line.quantity_per_pax),
      ingredient: (line.ingredients as Ingredient | null) ?? null,
    })),
  };
}

async function syncDishRecipe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dishId: string,
  recipe: Array<{ ingredient_id: string; quantity_per_pax: number }>
) {
  const unique = new Map<string, number>();
  for (const line of recipe) {
    unique.set(line.ingredient_id, line.quantity_per_pax);
  }

  const { error: deleteError } = await supabase
    .from("dish_ingredients")
    .delete()
    .eq("dish_id", dishId);
  if (deleteError) throw deleteError;

  if (unique.size === 0) return;

  const rows = [...unique.entries()].map(([ingredient_id, quantity_per_pax]) => ({
    dish_id: dishId,
    ingredient_id,
    quantity_per_pax,
  }));

  const { error: insertError } = await supabase.from("dish_ingredients").insert(rows);
  if (insertError) throw insertError;
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("stock_category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Ingredient[];
}

export async function createIngredient(input: unknown) {
  const parsed = ingredientSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      name: parsed.name,
      unit: parsed.unit,
      cost_per_unit: parsed.cost_per_unit,
      stock_category: parsed.stock_category,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidateCatalog();
  return data as Ingredient;
}

export async function updateIngredient(id: string, input: unknown) {
  const parsed = ingredientSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data, error } = await supabase
    .from("ingredients")
    .update({
      name: parsed.name,
      unit: parsed.unit,
      cost_per_unit: parsed.cost_per_unit,
      stock_category: parsed.stock_category,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  revalidateCatalog();
  return data as Ingredient;
}

export async function deleteIngredient(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
  revalidateCatalog();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Dishes + recipes
// ---------------------------------------------------------------------------

export async function getDishes(): Promise<DishWithRecipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(
      `
      *,
      dish_ingredients (
        ingredient_id,
        quantity_per_pax,
        ingredients (*)
      )
    `
    )
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapDishRow(row as Record<string, unknown>));
}

export async function createDish(input: unknown) {
  const parsed = dishWithRecipeSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data: dish, error } = await supabase
    .from("dishes")
    .insert({
      name: parsed.name,
      description: parsed.description?.trim() || null,
      category: parsed.category,
      image_url: normalizeImageUrl(parsed.image_url),
      recipe_yield: parsed.recipe_yield,
      base_price_cents: parsed.base_price_cents,
    })
    .select("*")
    .single();

  if (error) throw error;

  const perPaxRecipe = recipeLinesToPerPax(parsed.recipe, parsed.recipe_yield);

  try {
    await syncDishRecipe(supabase, dish.id, perPaxRecipe);
  } catch (recipeError) {
    await supabase.from("dishes").delete().eq("id", dish.id);
    throw recipeError;
  }

  revalidateCatalog();
  return dish;
}

export async function updateDish(id: string, input: unknown) {
  const parsed = dishWithRecipeSchema.parse(input);
  const supabase = await assertAdminWrite();

  const { data: dish, error } = await supabase
    .from("dishes")
    .update({
      name: parsed.name,
      description: parsed.description?.trim() || null,
      category: parsed.category,
      image_url: normalizeImageUrl(parsed.image_url),
      recipe_yield: parsed.recipe_yield,
      base_price_cents: parsed.base_price_cents,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  const perPaxRecipe = recipeLinesToPerPax(parsed.recipe, parsed.recipe_yield);
  await syncDishRecipe(supabase, id, perPaxRecipe);

  revalidateCatalog();
  return dish;
}

export async function deleteDish(id: string) {
  const supabase = await assertAdminWrite();
  const { error } = await supabase.from("dishes").delete().eq("id", id);
  if (error) throw error;
  revalidateCatalog();
  return { ok: true };
}
