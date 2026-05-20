"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GuestPreferences, Trip } from "@/lib/types/database";

export function useTripRealtime(tripId: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [preferences, setPreferences] = useState<GuestPreferences[]>([]);

  useEffect(() => {
    if (!tripId) return;

    const supabase = createClient();

    async function load() {
      const { data: t } = await supabase.from("trips").select("*").eq("id", tripId).single();
      if (t) setTrip(t as Trip);

      const { data: parts } = await supabase
        .from("trip_participants")
        .select("id")
        .eq("trip_id", tripId);

      if (parts?.length) {
        const { data: prefs } = await supabase
          .from("guest_preferences")
          .select("*")
          .in(
            "participant_id",
            parts.map((p) => p.id)
          );
        setPreferences((prefs ?? []) as GuestPreferences[]);
      }
    }

    void load();

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        (payload) => {
          if (payload.new) setTrip(payload.new as Trip);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guest_preferences" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId]);

  return { trip, preferences };
}
