import { z } from "zod";
import { INGREDIENT_STOCK_CATEGORIES, INGREDIENT_UNITS } from "@/lib/constants/ingredients";

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  unit: z.enum(INGREDIENT_UNITS),
  cost_per_unit: z.coerce.number().min(0, "Cost must be zero or greater"),
  stock_category: z.enum(INGREDIENT_STOCK_CATEGORIES),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
