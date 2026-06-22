"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DishFormDialog } from "@/components/admin/dish-form-dialog";
import { deleteDish } from "@/app/[locale]/(admin)/admin/catalog/admin-actions";
import type { DishWithRecipe, Ingredient } from "@/lib/types/database";

import {
  KIDS_DISH_CATEGORIES,
  REGULAR_DISH_CATEGORIES,
  type DishCategory,
} from "@/lib/constants/dishes";

interface DishesManagerProps {
  dishes: DishWithRecipe[];
  ingredients: Ingredient[];
  locale: string;
  mode?: "regular" | "kids";
}

export function DishesManager({
  dishes,
  ingredients,
  locale,
  mode = "regular",
}: DishesManagerProps) {
  const t = useTranslations(mode === "kids" ? "admin.kidsDishes" : "admin.dishes");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DishWithRecipe | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(dish: DishWithRecipe) {
    setEditing(dish);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteDish(id);
        router.refresh();
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <Button variant="gold" size="lg" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          {t("addButton")}
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {dishes.length === 0 ? (
            <p className="px-6 py-12 text-center text-neutral-500">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase tracking-wider text-neutral-600">
                    <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.category")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.description")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.recipeLines")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((dish) => (
                    <tr
                      key={dish.id}
                      className="border-b border-neutral-100 transition hover:bg-[#C4A052]/5"
                    >
                      <td className="px-4 py-3 font-medium text-[#1B3A4B]">{dish.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#1B3A4B]/5 px-2.5 py-0.5 text-xs font-medium text-[#1B3A4B]">
                          {t(`categories.${dish.category}` as "categories.breakfast")}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-neutral-600">
                        {dish.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t("recipeLineCount", { count: dish.recipe.length })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(dish)}
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(dish.id)}
                            disabled={pending && deletingId === dish.id}
                            aria-label={t("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DishFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dish={editing}
        ingredients={ingredients}
        locale={locale}
        mode={mode}
        categoryOptions={
          (mode === "kids" ? KIDS_DISH_CATEGORIES : REGULAR_DISH_CATEGORIES) as readonly DishCategory[]
        }
      />
    </div>
  );
}
