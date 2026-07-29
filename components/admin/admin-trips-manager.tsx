"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelAdminTrip,
  deleteAdminTrip,
  updateAdminTrip,
  type AdminTripRow,
} from "@/app/[locale]/(admin)/admin/admin-ops-actions";
import type { TripStatus } from "@/lib/types/database";
import { TRIP_DATES_UNAVAILABLE_MESSAGE } from "@/lib/trip/trip-date-collision";

interface AdminTripsManagerProps {
  trips: AdminTripRow[];
  locale: string;
}

const EDITABLE_STATUSES: TripStatus[] = [
  "draft",
  "submitted",
  "active",
  "completed",
  "settled",
  "cancelled",
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "draft":
      return "border-neutral-300 bg-neutral-50 text-neutral-700";
    case "submitted":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "active":
      return "border-green-300 bg-green-50 text-green-800";
    case "cancelled":
      return "border-red-300 bg-red-50 text-red-700";
    case "completed":
    case "settled":
      return "border-blue-300 bg-blue-50 text-blue-800";
    default:
      return "";
  }
}

export function AdminTripsManager({ trips, locale }: AdminTripsManagerProps) {
  const t = useTranslations("admin.tripsPage");
  const tc = useTranslations("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminTripRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    adultCount: "1",
    childCount: "0",
    crewCount: "3",
    status: "draft" as TripStatus,
  });

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

  function openEdit(trip: AdminTripRow) {
    setEditing(trip);
    setError(null);
    setForm({
      startDate: trip.start_date ?? "",
      endDate: trip.end_date ?? "",
      adultCount: String(trip.adult_count),
      childCount: String(trip.child_count),
      crewCount: String(trip.crew_count),
      status: trip.status,
    });
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateAdminTrip({
          tripId: editing.id,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          adultCount: Number(form.adultCount),
          childCount: Number(form.childCount),
          crewCount: Number(form.crewCount),
          status: form.status,
        });
        setEditing(null);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error && err.message === TRIP_DATES_UNAVAILABLE_MESSAGE
            ? t("datesUnavailable")
            : t("saveError");
        setError(message);
      }
    });
  }

  function handleCancel(trip: AdminTripRow) {
    if (!window.confirm(t("cancelConfirm"))) return;
    startTransition(async () => {
      await cancelAdminTrip(trip.id);
      router.refresh();
    });
  }

  function handleHardDelete(trip: AdminTripRow) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      await deleteAdminTrip(trip.id);
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
        <table className="w-full min-w-[800px] text-sm">
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
                  <td className="p-3">
                    {trip.adult_count + trip.child_count}
                    <span className="ml-1 text-xs text-neutral-400">
                      (+{trip.crew_count} {t("crewShort")})
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={statusBadgeClass(trip.status)}>
                      {t(`statuses.${trip.status}` as "statuses.draft")}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${locale}/chef/trip/${trip.id}`}>{t("viewOrder")}</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => openEdit(trip)}
                      >
                        {t("editTrip")}
                      </Button>
                      {trip.status !== "cancelled" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-700 hover:bg-amber-50"
                          disabled={pending}
                          onClick={() => handleCancel(trip)}
                        >
                          {t("cancelTrip")}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          disabled={pending}
                          onClick={() => handleHardDelete(trip)}
                        >
                          {t("delete")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>
              {editing ? t("editSubtitle", { ref: editing.ref }) : null}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip-start">{t("fields.startDate")}</Label>
                <Input
                  id="trip-start"
                  type="date"
                  className="mt-1.5"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="trip-end">{t("fields.endDate")}</Label>
                <Input
                  id="trip-end"
                  type="date"
                  className="mt-1.5"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="trip-adults">{t("fields.adults")}</Label>
                <Input
                  id="trip-adults"
                  type="number"
                  min={1}
                  step="1"
                  className="mt-1.5"
                  value={form.adultCount}
                  onChange={(e) => setForm((f) => ({ ...f, adultCount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-children">{t("fields.children")}</Label>
                <Input
                  id="trip-children"
                  type="number"
                  min={0}
                  step="1"
                  className="mt-1.5"
                  value={form.childCount}
                  onChange={(e) => setForm((f) => ({ ...f, childCount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-crew">{t("fields.crew")}</Label>
                <Input
                  id="trip-crew"
                  type="number"
                  min={0}
                  step="1"
                  className="mt-1.5"
                  value={form.crewCount}
                  onChange={(e) => setForm((f) => ({ ...f, crewCount: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>{t("fields.status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as TripStatus }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`statuses.${status}` as "statuses.draft")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {tc("back")}
              </Button>
              <Button type="submit" variant="gold" disabled={pending}>
                {pending ? tc("saving") : tc("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
