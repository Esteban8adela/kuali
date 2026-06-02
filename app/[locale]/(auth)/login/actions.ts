"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/get-user-role";
import { roleHomePath } from "@/lib/auth/roles";
import { headers } from "next/headers";

function getLocaleFromHeaders(h: Headers): string {
  const referer = h.get("referer") ?? "";
  const match = referer.match(/\/(en|es)\//);
  return match ? match[1] : "en";
}

export type AuthActionResult = {
  error: string | null;
  redirect: string | null;
  success?: "confirm_email";
};

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "missing_fields", redirect: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
      return { error: "invalid_credentials", redirect: null };
    }
    if (msg.includes("email not confirmed")) {
      return { error: "email_not_confirmed", redirect: null };
    }
    return { error: "generic", redirect: null };
  }

  if (!data.user) {
    return { error: "generic", redirect: null };
  }

  const role = await resolveUserRole(supabase, data.user);
  const h = await headers();
  const locale = getLocaleFromHeaders(h);
  const destination = roleHomePath(role, locale);
  return { error: null, redirect: destination };
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password || !firstName || !lastName) {
    return { error: "missing_fields", redirect: null };
  }

  const fullName = `${firstName} ${lastName}`;

  if (password.length < 6) {
    return { error: "weak_password", redirect: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "renta",
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "already_exists", redirect: null };
    }
    return { error: "generic", redirect: null };
  }

  if (data.user) {
    if (data.session) {
      const h = await headers();
      const locale = getLocaleFromHeaders(h);
      return { error: null, redirect: `/${locale}/guest/dashboard` };
    }
    return { error: null, redirect: null, success: "confirm_email" };
  }

  if (!error) {
    return { error: null, redirect: null, success: "confirm_email" };
  }

  return { error: "generic", redirect: null };
}
