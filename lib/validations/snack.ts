import { z } from "zod";

const SNACK_DEFAULT_CATEGORY = "general";

export const snackSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_es: z.string().trim().min(1, "Spanish name is required"),
  description_en: z.string().trim().optional().nullable(),
  description_es: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().default(SNACK_DEFAULT_CATEGORY),
  base_price_cents: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export type SnackInput = z.infer<typeof snackSchema>;
