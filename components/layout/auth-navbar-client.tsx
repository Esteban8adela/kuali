"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User } from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { logoutAction } from "@/app/[locale]/(auth)/logout/actions";

interface AuthNavbarClientProps {
  email: string | null;
  displayName: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AuthNavbarClient({ email, displayName }: AuthNavbarClientProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const label = displayName ?? email ?? tc("guestUser");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#C4A052]/10 bg-white/90 px-4 backdrop-blur md:px-8">
      <Link
        href={`/${locale}`}
        className="font-display text-2xl tracking-[0.15em] text-[#1B3A4B]"
      >
        {tc("brand")}
      </Link>
      <div className="flex items-center gap-3 md:gap-4">
        <LocaleSwitcher />
        {email && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={() => setIsOpen((open) => !open)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#1B3A4B]/15 bg-white px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-[#C4A052]/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B3A4B]/10 text-xs font-semibold text-[#1B3A4B]">
                {displayName ? initials(displayName) : <User className="h-4 w-4" aria-hidden />}
              </span>
              <span className="hidden max-w-[160px] truncate md:inline">{label}</span>
            </button>
            {isOpen && (
              <div
                role="menu"
                className="absolute right-0 z-[100] mt-2 w-56 rounded-xl border border-[#C4A052]/20 bg-white p-3 shadow-lg"
              >
                <p className="truncate text-sm font-semibold text-neutral-900">{label}</p>
                {displayName && email && displayName !== email && (
                  <p className="mt-0.5 truncate text-xs text-neutral-700">{email}</p>
                )}
                <form action={logoutAction} className="mt-3 border-t border-neutral-100 pt-3">
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full rounded-lg border border-[#1B3A4B]/20 px-3 py-2 text-sm font-medium text-[#1B3A4B] transition hover:bg-[#1B3A4B]/5"
                  >
                    {tc("logout")}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
