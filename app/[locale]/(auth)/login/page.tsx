"use client";

import { useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { loginAction, signUpAction } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result =
        mode === "login"
          ? await loginAction(formData)
          : await signUpAction(formData);

      if (result.error) {
        setError(getErrorMessage(result.error));
        return;
      }

      if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
        return;
      }

      if (result.success === "confirm_email") {
        formRef.current?.reset();
        setSuccess(t("signUpSuccess"));
        return;
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case "invalid_credentials":
        return t("errors.invalidCredentials");
      case "email_not_confirmed":
        return t("errors.emailNotConfirmed");
      case "missing_fields":
        return t("errors.missingFields");
      case "weak_password":
        return t("errors.weakPassword");
      case "already_exists":
        return t("errors.alreadyExists");
      default:
        return t("errors.generic");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 items-center justify-between px-6 md:px-12">
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
            <CardTitle className="font-display text-3xl">
              {mode === "login" ? t("title") : t("signUpTitle")}
            </CardTitle>
            <CardDescription>
              {mode === "login" ? t("subtitle") : t("signUpSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("firstName")}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      placeholder="Juan"
                      disabled={isLoading}
                      onChange={() => error && setError(null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      placeholder="Pérez"
                      disabled={isLoading}
                      onChange={() => error && setError(null)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  disabled={isLoading}
                  onChange={() => error && setError(null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  placeholder="••••••••"
                  disabled={isLoading}
                  showLabel={t("showPassword")}
                  hideLabel={t("hidePassword")}
                  onChange={() => error && setError(null)}
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

              {success && (
                <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#C4A052] px-6 text-base font-medium text-white transition hover:bg-[#B8943F] disabled:opacity-50"
              >
                {isLoading
                  ? t("signingIn")
                  : mode === "login"
                    ? t("signIn")
                    : t("signUp")}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setSuccess(null);
                  formRef.current?.reset();
                }}
                className="text-sm text-[#1B3A4B] underline underline-offset-2 hover:text-[#C4A052]"
              >
                {mode === "login" ? t("switchToSignUp") : t("switchToLogin")}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
