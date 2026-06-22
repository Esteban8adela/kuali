"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteAdminTrip,
  type AdminTripRow,
} from "@/app/[locale]/(admin)/admin/admin-ops-actions";

interface AdminTripsManagerProps {
  trips: AdminTripRow[];
  locale: string;
}

export function AdminTripsManager({ trips, locale }: AdminTripsManagerProps) {
  const t = useTranslations("admin.tripsPage");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (trip) =>
        trip.ref.toLowerCase().includes(q) ||
        trip.id.toLowerCase().includes(q) ||
        (trip.guest_name?.toLowerCase().includes(q) ?? false)
    );
  }, [trips, query]);

  function handleDelete(tripId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteAdminTrip(tripId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#1B3A4B]">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
              <th className="p-3 font-medium">{t("columns.ref")}</th>
              <th className="p-3 font-medium">{t("columns.guest")}</th>
              <th className="p-3 font-medium">{t("columns.dates")}</th>
              <th className="p-3 font-medium">{t("columns.pax")}</th>
              <th className="p-3 font-medium">{t("columns.status")}</th>
              <th className="p-3 text-right font-medium">{t("columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filtered.map((trip) => (
                <tr key={trip.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                  <td className="p-3 font-mono text-xs font-medium text-[#1B3A4B]">{trip.ref}</td>
                  <td className="p-3">{trip.guest_name ?? "—"}</td>
                  <td className="p-3 text-neutral-600">
                    {trip.start_date ?? "—"}
                    {trip.end_date ? ` → ${trip.end_date}` : ""}
                  </td>
                  <td className="p-3">{trip.adult_count + trip.child_count}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {trip.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/guest/trip/${trip.id}/overview`}>
                          {t("viewEdit")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={pending}
                        onClick={() => handleDelete(trip.id)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
