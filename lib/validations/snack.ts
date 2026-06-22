import { z } from "zod";
import { SNACK_CATEGORIES } from "@/lib/constants/snacks";

export const snackSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(SNACK_CATEGORIES),
  base_price_cents: z.coerce.number().int().min(0),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export type SnackInput = z.infer<typeof snackSchema>;
