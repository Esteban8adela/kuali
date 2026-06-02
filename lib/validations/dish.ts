import { z } from "zod";
import { DISH_CATEGORIES } from "@/lib/constants/dishes";

export const recipeLineSchema = z.object({
  ingredient_id: z.string().uuid(),
  total_quantity: z.coerce.number().positive("Total quantity must be greater than zero"),
});

export const dishSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().nullable(),
  category: z.enum(DISH_CATEGORIES),
  recipe_yield: z.coerce.number().positive("Recipe yield must be greater than zero"),
  image_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const dishWithRecipeSchema = dishSchema.extend({
  recipe: z.array(recipeLineSchema).default([]),
});

export type DishInput = z.infer<typeof dishSchema>;
export type DishWithRecipeInput = z.infer<typeof dishWithRecipeSchema>;
export type RecipeLineInput = z.infer<typeof recipeLineSchema>;

export function recipeLinesToPerPax(
  recipe: RecipeLineInput[],
  recipeYield: number
): Array<{ ingredient_id: string; quantity_per_pax: number }> {
  return recipe.map((line) => ({
    ingredient_id: line.ingredient_id,
    quantity_per_pax: line.total_quantity / recipeYield,
  }));
}
