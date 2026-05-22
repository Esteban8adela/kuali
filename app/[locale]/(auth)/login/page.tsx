"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { getRoleFromUser } from "@/lib/auth/get-user-role";
import { roleHomePath, type UserRole } from "@/lib/auth/roles";

function mapAuthError(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return t("errors.invalidCredentials");
  }
  if (lower.includes("email not confirmed")) {
    return t("errors.emailNotConfirmed");
  }
  return t("errors.generic");
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(mapAuthError(signInError.message, t));
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(t("errors.generic"));
      setLoading(false);
      return;
    }

    const fromApp = getRoleFromUser(data.user);
    let role: UserRole = fromApp ?? "renta";

    if (!fromApp) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile?.role) {
        setError(t("errors.profileNotFound"));
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      role = profile.role as UserRole;
    }
    router.push(roleHomePath(role, locale));
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href={`/${locale}`}
          className="font-display text-2xl tracking-[0.2em] text-[#1B3A4B]"
        >
          {tc("brand")}
        </Link>
        <LocaleSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <Card className="glass-card w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-2 text-center sm:text-left">
            <CardTitle className="font-display text-3xl">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
