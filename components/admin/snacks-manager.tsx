"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SnackFormDialog } from "@/components/admin/snack-form-dialog";
import { deleteSnack } from "@/app/[locale]/(admin)/admin/snacks/actions";
import type { Snack } from "@/lib/types/database";

interface SnacksManagerProps {
  snacks: Snack[];
  locale: string;
}

export function SnacksManager({ snacks, locale }: SnacksManagerProps) {
  const t = useTranslations("admin.snacks");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Snack | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    [locale]
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(snack: Snack) {
    setEditing(snack);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteSnack(id);
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
          {snacks.length === 0 ? (
            <p className="px-6 py-12 text-center text-neutral-500">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[#1B3A4B]/10 bg-[#1B3A4B]/5 text-left text-xs uppercase tracking-wider text-neutral-600">
                    <th className="px-4 py-3 font-medium">{t("columns.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.category")}</th>
                    <th className="px-4 py-3 font-medium">{t("columns.basePrice")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {snacks.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-100 transition hover:bg-[#C4A052]/5"
                    >
                      <td className="px-4 py-3 font-medium text-[#1B3A4B]">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#1B3A4B]/5 px-2.5 py-0.5 text-xs font-medium text-[#1B3A4B]">
                          {t(`categories.${item.category}` as "categories.chips")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {currency.format(item.base_price_cents / 100)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            aria-label={t("edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            disabled={pending && deletingId === item.id}
                            aria-label={t("delete")}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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

      <SnackFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snack={editing}
        locale={locale}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
