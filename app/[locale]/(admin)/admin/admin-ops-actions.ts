"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";

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
  status: string;
  start_date: string | null;
  end_date: string | null;
  adult_count: number;
  child_count: number;
  guest_name: string | null;
  created_at: string;
}

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
    .select("id, status, start_date, end_date, adult_count, child_count, created_at, created_by")
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
    status: trip.status,
    start_date: trip.start_date,
    end_date: trip.end_date,
    adult_count: trip.adult_count,
    child_count: trip.child_count,
    guest_name: nameById.get(trip.created_by) ?? null,
    created_at: trip.created_at,
  }));
}

export async function deleteAdminTrip(tripId: string) {
  await assertAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
  revalidatePath("/", "layout");
  return { ok: true };
}
