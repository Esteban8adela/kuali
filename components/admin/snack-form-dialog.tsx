"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { SNACK_CATEGORIES } from "@/lib/constants/snacks";
import { createSnack, updateSnack } from "@/app/[locale]/(admin)/admin/snacks/actions";
import { formatCurrency } from "@/lib/utils";
import type { Snack } from "@/lib/types/database";

interface SnackFormValues {
  name: string;
  category: string;
  base_price: string;
}

const emptyForm = (): SnackFormValues => ({
  name: "",
  category: "chips",
  base_price: "0",
});

function fromSnack(snack: Snack): SnackFormValues {
  return {
    name: snack.name,
    category: snack.category,
    base_price: String((snack.base_price_cents / 100).toFixed(2)),
  };
}

interface SnackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snack?: Snack | null;
  locale: string;
  onSaved: () => void;
}

export function SnackFormDialog({
  open,
  onOpenChange,
  snack,
  locale,
  onSaved,
}: SnackFormDialogProps) {
  const t = useTranslations("admin.snacks");
  const tc = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SnackFormValues>(snack ? fromSnack(snack) : emptyForm());
  const isEdit = Boolean(snack);

  function handleOpenChange(next: boolean) {
    if (next) {
      setForm(snack ? fromSnack(snack) : emptyForm());
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const basePriceCents = Math.round(parseFloat(form.base_price || "0") * 100);

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          category: form.category,
          base_price_cents: Number.isFinite(basePriceCents) ? basePriceCents : 0,
        };
        if (isEdit && snack) {
          await updateSnack(snack.id, payload);
        } else {
          await createSnack(payload);
        }
        onSaved();
        onOpenChange(false);
      } catch {
        setError(t("saveError"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("formSubtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="snack-name">{t("fields.name")}</Label>
            <Input
              id="snack-name"
              className="mt-1.5"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>{t("fields.category")}</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="snack-price">{t("fields.basePrice")}</Label>
            <Input
              id="snack-price"
              type="number"
              min="0"
              step="1"
              className="mt-1.5"
              value={form.base_price}
              onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
            />
            <p className="mt-1 text-xs text-neutral-500">
              {t("pricePreview", {
                price: formatCurrency(parseFloat(form.base_price || "0") || 0, locale),
              })}
            </p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
