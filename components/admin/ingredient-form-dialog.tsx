"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
  INGREDIENT_STOCK_CATEGORIES,
  INGREDIENT_UNITS,
  type IngredientStockCategory,
  type IngredientUnit,
} from "@/lib/constants/ingredients";
import {
  createIngredient,
  updateIngredient,
} from "@/app/[locale]/(admin)/admin/catalog/admin-actions";
import type { Ingredient } from "@/lib/types/database";

export interface IngredientFormValues {
  name: string;
  unit: IngredientUnit;
  cost_per_unit: string;
  stock_category: IngredientStockCategory;
}

const emptyForm = (): IngredientFormValues => ({
  name: "",
  unit: "kg",
  cost_per_unit: "",
  stock_category: "abarrotes",
});

function fromIngredient(ingredient: Ingredient): IngredientFormValues {
  return {
    name: ingredient.name,
    unit: ingredient.unit as IngredientUnit,
    cost_per_unit: String(ingredient.cost_per_unit),
    stock_category: ingredient.stock_category as IngredientStockCategory,
  };
}

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
}

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient,
}: IngredientFormDialogProps) {
  const t = useTranslations("admin.ingredients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IngredientFormValues>(
    ingredient ? fromIngredient(ingredient) : emptyForm()
  );

  const isEdit = Boolean(ingredient);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setForm(ingredient ? fromIngredient(ingredient) : emptyForm());
    } else if (ingredient) {
      setForm(fromIngredient(ingredient));
    } else {
      setForm(emptyForm());
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name.trim(),
      unit: form.unit,
      cost_per_unit: Number(form.cost_per_unit),
      stock_category: form.stock_category,
    };

    startTransition(async () => {
      try {
        if (isEdit && ingredient) {
          await updateIngredient(ingredient.id, payload);
        } else {
          await createIngredient(payload);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("formSubtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name">{t("fields.name")}</Label>
            <Input
              id="ingredient-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={pending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("fields.unit")}</Label>
              <Select
                value={form.unit}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unit: v as IngredientUnit }))
                }
                disabled={pending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {t(`units.${unit}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredient-cost">
                {t("fields.costPerUnit", { unit: t(`units.${form.unit}` as "units.kg") })}
              </Label>
              <Input
                id="ingredient-cost"
                type="number"
                min={0}
                step={form.unit === "kg" || form.unit === "g" ? "0.1" : "any"}
                value={form.cost_per_unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cost_per_unit: e.target.value }))
                }
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("fields.category")}</Label>
            <Select
              value={form.stock_category}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  stock_category: v as IngredientStockCategory,
                }))
              }
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INGREDIENT_STOCK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
