import { z } from "zod";

export const BEVERAGE_CATEGORIES = ["spirit", "wine", "beer", "mixer"] as const;

const BILINGUAL_CATEGORIES = new Set<string>(["wine", "mixer"]);

export const beverageSchema = z
  .object({
    name: z.string().trim().optional(),
    name_en: z.string().trim().optional(),
    name_es: z.string().trim().optional(),
    presentation: z.string().trim().optional().nullable(),
    category: z.enum(BEVERAGE_CATEGORIES),
    subcategory: z.string().trim().optional().nullable(),
    base_price_cents: z.coerce.number().min(0),
    sort_order: z.coerce.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (BILINGUAL_CATEGORIES.has(data.category)) {
      if (!data.name_en?.trim()) {
        ctx.addIssue({ code: "custom", path: ["name_en"], message: "English name is required" });
      }
      if (!data.name_es?.trim()) {
        ctx.addIssue({ code: "custom", path: ["name_es"], message: "Spanish name is required" });
      }
    } else if (!data.name?.trim()) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Name is required" });
    }
  });

export type BeverageInput = z.infer<typeof beverageSchema>;

export function beverageNamesForDb(parsed: z.infer<typeof beverageSchema>): {
  name_en: string;
  name_es: string;
} {
  if (BILINGUAL_CATEGORIES.has(parsed.category)) {
    return { name_en: parsed.name_en!.trim(), name_es: parsed.name_es!.trim() };
  }
  const name = parsed.name!.trim();
  return { name_en: name, name_es: name };
}
