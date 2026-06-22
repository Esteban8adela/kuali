"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type DishCategory,
} from "@/lib/constants/dishes";
import {
  createDish,
  updateDish,
} from "@/app/[locale]/(admin)/admin/catalog/admin-actions";
import type { DishWithRecipe, Ingredient } from "@/lib/types/database";
import { formatCurrency, centsToUsd } from "@/lib/utils";
import {
  ManualPriceInput,
  manualPriceDisplayFromCents,
} from "@/components/admin/manual-price-input";

interface RecipeRow {
  key: string;
  ingredient_id: string;
  total_quantity: string;
}

interface DishFormValues {
  name: string;
  description: string;
  category: DishCategory;
  image_url: string;
  recipe_yield: string;
}

const emptyForm = (defaultCategory: DishCategory): DishFormValues => ({
  name: "",
  description: "",
  category: defaultCategory,
  image_url: "",
  recipe_yield: "1",
});

function fromDish(dish: DishWithRecipe): DishFormValues {
  return {
    name: dish.name,
    description: dish.description ?? "",
    category: dish.category as DishCategory,
    image_url: dish.image_url ?? "",
    recipe_yield: String(dish.recipe_yield ?? 1),
  };
}

function fromRecipe(dish: DishWithRecipe | null | undefined): RecipeRow[] {
  if (!dish?.recipe.length) return [];
  const yieldValue = dish.recipe_yield ?? 1;
  return dish.recipe.map((line) => ({
    key: line.ingredient_id,
    ingredient_id: line.ingredient_id,
    total_quantity: String(line.quantity_per_pax * yieldValue),
  }));
}

function newRecipeRow(): RecipeRow {
  return {
    key: crypto.randomUUID(),
    ingredient_id: "",
    total_quantity: "",
  };
}

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}

interface DishFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish?: DishWithRecipe | null;
  ingredients: Ingredient[];
  locale: string;
  mode?: "regular" | "kids";
  categoryOptions: readonly DishCategory[];
}

export function DishFormDialog({
  open,
  onOpenChange,
  dish,
  ingredients,
  locale,
  mode = "regular",
  categoryOptions,
}: DishFormDialogProps) {
  const t = useTranslations(mode === "kids" ? "admin.kidsDishes" : "admin.dishes");
  const ti = useTranslations("admin.ingredients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DishFormValues>(() =>
    dish ? fromDish(dish) : emptyForm(categoryOptions[0] ?? "lunch_main")
  );
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>(() => fromRecipe(dish));
  const [manualPriceDisplay, setManualPriceDisplay] = useState(() =>
    manualPriceDisplayFromCents(dish?.manual_price_cents ?? null, locale)
  );
  const [manualPriceUsdCents, setManualPriceUsdCents] = useState<number | null>(
    dish?.manual_price_cents ?? null
  );

  const isEdit = Boolean(dish);

  const ingredientById = useMemo(() => {
    const map = new Map<string, Ingredient>();
    for (const item of ingredients) {
      map.set(item.id, item);
    }
    return map;
  }, [ingredients]);

  const recipeYield = useMemo(() => {
    const value = Number(form.recipe_yield);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [form.recipe_yield]);

  const totalDishCost = useMemo(() => {
    return recipeRows.reduce((sum, row) => {
      const qty = Number(row.total_quantity);
      const ingredient = ingredientById.get(row.ingredient_id);
      if (!row.ingredient_id || !Number.isFinite(qty) || qty <= 0 || !ingredient) {
        return sum;
      }
      return sum + Number(ingredient.cost_per_unit) * qty;
    }, 0);
  }, [recipeRows, ingredientById]);

  const costPerPerson = totalDishCost / recipeYield;

  const ingredientCostCents = Math.round(costPerPerson * 100);
  const effectivePriceCents = manualPriceUsdCents ?? ingredientCostCents;

  const priceLabel =
    locale === "es" ? t("fields.manualPriceMxn") : t("fields.manualPriceUsd");

  function resetState(nextDish?: DishWithRecipe | null) {
    setError(null);
    setForm(nextDish ? fromDish(nextDish) : emptyForm(categoryOptions[0] ?? "lunch_main"));
    setRecipeRows(nextDish?.recipe.length ? fromRecipe(nextDish) : []);
    setManualPriceDisplay(
      manualPriceDisplayFromCents(nextDish?.manual_price_cents ?? null, locale)
    );
    setManualPriceUsdCents(nextDish?.manual_price_cents ?? null);
  }

  function handleOpenChange(next: boolean) {
    resetState(dish);
    onOpenChange(next);
  }

  function addRecipeRow() {
    setRecipeRows((rows) => [...rows, newRecipeRow()]);
  }

  function removeRecipeRow(key: string) {
    setRecipeRows((rows) => rows.filter((row) => row.key !== key));
  }

  function updateRecipeRow(key: string, patch: Partial<RecipeRow>) {
    setRecipeRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const recipe = recipeRows
      .filter((row) => row.ingredient_id && Number(row.total_quantity) > 0)
      .map((row) => ({
        ingredient_id: row.ingredient_id,
        total_quantity: Number(row.total_quantity),
      }));

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      image_url: form.image_url.trim() || null,
      recipe_yield: Number(form.recipe_yield),
      manual_price_cents: manualPriceUsdCents,
      base_price_cents: effectivePriceCents,
      recipe,
    };

    startTransition(async () => {
      try {
        if (isEdit && dish) {
          await updateDish(dish.id, payload);
        } else {
          await createDish(payload);
        }
        handleOpenChange(false);
        router.refresh();
      } catch {
        setError(t("saveError"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("formSubtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dish-name">{t("fields.name")}</Label>
              <Input
                id="dish-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dish-description">{t("fields.description")}</Label>
              <textarea
                id="dish-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C4A052]/40 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("fields.category")}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as DishCategory }))
                  }
                  disabled={pending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`categories.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-yield">{t("fields.recipeYield")}</Label>
                <Input
                  id="dish-yield"
                  type="number"
                  min={1}
                  step="1"
                  value={form.recipe_yield}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipe_yield: e.target.value }))
                  }
                  required
                  disabled={pending}
                />
              </div>

              <ManualPriceInput
                label={priceLabel}
                locale={locale}
                usdCents={manualPriceUsdCents ?? ingredientCostCents}
                value={manualPriceDisplay}
                onChange={(display, cents) => {
                  setManualPriceDisplay(display);
                  setManualPriceUsdCents(display.trim() === "" ? null : cents);
                }}
              />
              <p className="text-xs text-neutral-500">
                {t("ingredientCostLabel")}: {formatCurrency(costPerPerson, locale)}
                {" · "}
                {t("finalPriceLabel")}: {formatCurrency(centsToUsd(effectivePriceCents), locale)}
              </p>

              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="dish-image">{t("fields.imageUrl")}</Label>
                <Input
                  id="dish-image"
                  type="url"
                  placeholder="https://"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  disabled={pending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-[#1B3A4B]/10 bg-[#1B3A4B]/[0.02] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1B3A4B]">{t("recipe.title")}</h3>
                <p className="text-xs text-neutral-500">{t("recipe.subtitle")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRecipeRow}
                disabled={pending || ingredients.length === 0}
              >
                <Plus className="h-4 w-4" />
                {t("recipe.addLine")}
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("recipe.noIngredients")}</p>
            ) : recipeRows.length === 0 ? (
              <p className="text-sm text-neutral-500">{t("recipe.empty")}</p>
            ) : (
              <div className="space-y-3">
                {recipeRows.map((row) => {
                  const ingredient = ingredientById.get(row.ingredient_id);
                  const totalQty = Number(row.total_quantity);
                  const perPerson =
                    row.ingredient_id &&
                    Number.isFinite(totalQty) &&
                    totalQty > 0 &&
                    recipeYield > 0
                      ? totalQty / recipeYield
                      : null;

                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="grid grid-cols-[1fr_140px_40px] items-end gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("recipe.ingredient")}</Label>
                          <Select
                            value={row.ingredient_id || undefined}
                            onValueChange={(v) =>
                              updateRecipeRow(row.key, { ingredient_id: v })
                            }
                            disabled={pending}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("recipe.selectIngredient")} />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({ti(`units.${item.unit}` as "units.kg")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">{t("recipe.totalQuantity")}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.001"
                            value={row.total_quantity}
                            onChange={(e) =>
                              updateRecipeRow(row.key, { total_quantity: e.target.value })
                            }
                            disabled={pending}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeRecipeRow(row.key)}
                          disabled={pending}
                          aria-label={t("recipe.removeLine")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {perPerson !== null && ingredient && (
                        <p className="text-xs text-neutral-500">
                          {t("recipe.equivPerPerson", {
                            amount: formatQty(perPerson),
                            unit: ti(`units.${ingredient.unit}` as "units.kg"),
                          })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 border-t border-[#1B3A4B]/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1B3A4B]">
                  {t("recipe.totalDishCost")}
                </span>
                <span className="text-sm font-semibold text-neutral-700">
                  {formatCurrency(totalDishCost, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1B3A4B]">
                  {t("recipe.totalCostPerPerson")}
                </span>
                <span className="font-display text-lg text-[#C4A052]">
                  {formatCurrency(costPerPerson, locale)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              {tc("back")}
            </Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
