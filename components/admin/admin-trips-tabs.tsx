"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface AdminTripRow {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  crew_count: number;
  created_at: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function classifyTrip(trip: AdminTripRow): "active" | "past" | "future" {
  const today = todayISO();
  const start = trip.start_date;
  const end = trip.end_date;

  if (trip.status === "completed" || trip.status === "settled") return "past";
  if (end && end < today) return "past";
  if (start && start > today) return "future";
  if (
    trip.status === "active" ||
    trip.status === "submitted" ||
    (start && end && start <= today && today <= end)
  ) {
    return "active";
  }
  if (start && start > today) return "future";
  return "active";
}

function TripList({ trips, empty }: { trips: AdminTripRow[]; empty: string }) {
  if (!trips.length) {
    return <p className="py-8 text-center text-neutral-500">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {trips.map((trip) => (
        <li
          key={trip.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#C4A052]/20 bg-white px-4 py-3"
        >
          <div>
            <p className="font-medium text-[#1B3A4B]">
              {trip.adult_count + trip.child_count} guests · crew {trip.crew_count}
            </p>
            <p className="text-sm text-neutral-500">
              {trip.start_date ?? "—"} → {trip.end_date ?? "—"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {trip.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function AdminTripsTabs({ trips }: { trips: AdminTripRow[] }) {
  const t = useTranslations("admin.reservations");

  const grouped = useMemo(() => {
    const active: AdminTripRow[] = [];
    const past: AdminTripRow[] = [];
    const future: AdminTripRow[] = [];
    for (const trip of trips) {
      const bucket = classifyTrip(trip);
      if (bucket === "active") active.push(trip);
      else if (bucket === "past") past.push(trip);
      else future.push(trip);
    }
    return { active, past, future };
  }, [trips]);

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="active">
          {t("active")} ({grouped.active.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          {t("past")} ({grouped.past.length})
        </TabsTrigger>
        <TabsTrigger value="future">
          {t("future")} ({grouped.future.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <Card>
          <CardContent className="pt-6">
            <TripList trips={grouped.active} empty={t("emptyActive")} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="past">
        <Card>
          <CardContent className="pt-6">
            <TripList trips={grouped.past} empty={t("emptyPast")} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="future">
        <Card>
          <CardContent className="pt-6">
            <TripList trips={grouped.future} empty={t("emptyFuture")} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
