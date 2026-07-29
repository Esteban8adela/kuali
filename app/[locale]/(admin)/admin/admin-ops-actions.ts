"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";
import type { TripStatus } from "@/lib/types/database";
import { getCrewCount } from "@/lib/pricing/crew";
import { coerceToDateOnlyString } from "@/lib/trip/date-validation";
import {
  BLOCKING_TRIP_STATUSES,
  dateRangesOverlap,
  TRIP_DATES_UNAVAILABLE_MESSAGE,
} from "@/lib/trip/trip-date-collision";

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = await resolveUserRole(supabase, user);
  if (!isAdminRole(role)) throw new Error("Forbidden");
  return supabase;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
}

export interface AdminTripRow {
  id: string;
  ref: string;
  status: TripStatus;
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  crew_count: number;
  guest_name: string | null;
  created_at: string;
}

const adminTripUpdateSchema = z.object({
  tripId: z.string().uuid(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  adultCount: z.coerce.number().int().min(1).max(20),
  childCount: z.coerce.number().int().min(0).max(20),
  crewCount: z.coerce.number().int().min(0).max(10).optional(),
  status: z.enum(["draft", "submitted", "active", "completed", "settled", "cancelled"]),
});

export type AdminTripUpdateInput = z.infer<typeof adminTripUpdateSchema>;

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  await assertAdmin();
  const supabase = await createServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const emailById = new Map<string, string>();
  const admin = serviceClient();
  if (admin) {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const user of authData?.users ?? []) {
      if (user.email) emailById.set(user.id, user.email);
    }
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById.get(p.id) ?? null,
    role: p.role as UserRole,
  }));
}

export async function updateUserRole(userId: string, role: UserRole) {
  await assertAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getAdminTrips(): Promise<AdminTripRow[]> {
  const supabase = await assertAdmin();
  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      "id, status, start_date, end_date, adult_count, child_count, crew_count, created_at, created_by"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!trips?.length) return [];

  const creatorIds = [...new Set(trips.map((t) => t.created_by))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", creatorIds);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return trips.map((trip) => ({
    id: trip.id,
    ref: trip.id.slice(0, 8).toUpperCase(),
    status: trip.status as TripStatus,
    start_date: trip.start_date,
    end_date: trip.end_date,
    adult_count: trip.adult_count,
    child_count: trip.child_count,
    crew_count: trip.crew_count ?? getCrewCount(trip.adult_count, trip.child_count),
    guest_name: nameById.get(trip.created_by) ?? null,
    created_at: trip.created_at,
  }));
}

export async function updateAdminTrip(input: unknown) {
  const parsed = adminTripUpdateSchema.parse(input);
  const supabase = await assertAdmin();

  const startDate = coerceToDateOnlyString(parsed.startDate ?? null);
  const endDate = coerceToDateOnlyString(parsed.endDate ?? null);

  if (startDate && endDate) {
    const { data: blockingTrips, error: conflictError } = await supabase
      .from("trips")
      .select("id, start_date, end_date")
      .neq("id", parsed.tripId)
      .in("status", BLOCKING_TRIP_STATUSES)
      .not("start_date", "is", null)
      .not("end_date", "is", null);

    if (conflictError) throw conflictError;

    const hasCollision = (blockingTrips ?? []).some(
      (trip) =>
        trip.start_date &&
        trip.end_date &&
        dateRangesOverlap(startDate, endDate, trip.start_date, trip.end_date)
    );

    if (hasCollision) {
      throw new Error(TRIP_DATES_UNAVAILABLE_MESSAGE);
    }
  }

  const crewCount =
    parsed.crewCount ?? getCrewCount(parsed.adultCount, parsed.childCount);

  const { error } = await supabase
    .from("trips")
    .update({
      start_date: startDate,
      end_date: endDate,
      adult_count: parsed.adultCount,
      child_count: parsed.childCount,
      crew_count: crewCount,
      status: parsed.status,
    })
    .eq("id", parsed.tripId);

  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Soft-cancel: set status to cancelled (keeps historical record). */
export async function cancelAdminTrip(tripId: string) {
  await assertAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("id", tripId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Hard delete — use sparingly. Prefer cancelAdminTrip. */
export async function deleteAdminTrip(tripId: string) {
  await assertAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
}
