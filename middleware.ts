import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";
import { resolveUserRole } from "./lib/auth/get-user-role";
import { roleHomePath, type UserRole } from "./lib/auth/roles";

const intlMiddleware = createIntlMiddleware(routing);

const publicPaths = ["/login", "/auth/callback"];

function stripLocale(pathname: string): { locale: string; path: string } {
  const localeMatch = pathname.match(/^\/(en|es)(\/|$)/);
  const locale = localeMatch?.[1] ?? "en";
  const path = pathname.replace(/^\/(en|es)/, "") || "/";
  return { locale, path };
}

function isRoleSection(path: string): "guest" | "chef" | "admin" | null {
  if (path.startsWith("/guest")) return "guest";
  if (path.startsWith("/chef")) return "chef";
  if (path.startsWith("/admin")) return "admin";
  return null;
}

function roleAllowedInSection(role: UserRole, section: "guest" | "chef" | "admin"): boolean {
  if (section === "guest") return role === "renta" || role === "socio";
  if (section === "chef") return role === "chef" || role === "admin";
  if (section === "admin") return role === "admin";
  return false;
}

export async function middleware(request: NextRequest) {
  const { locale, path } = stripLocale(request.nextUrl.pathname);
  const isPublic = publicPaths.some((p) => path.startsWith(p));
  const isRoot = path === "/" || path === "";

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (user) {
    if (isPublic || isRoot) {
      try {
        const role = await resolveUserRole(supabase, user);
        const home = roleHomePath(role, locale);
        const url = request.nextUrl.clone();
        url.pathname = home;
        const redirect = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
        return redirect;
      } catch {
        // If role resolution fails, let them through to avoid loop
      }
    }

    const section = isRoleSection(path);
    if (section) {
      try {
        const role = await resolveUserRole(supabase, user);
        if (!roleAllowedInSection(role, section)) {
          const home = roleHomePath(role, locale);
          const url = request.nextUrl.clone();
          url.pathname = home;
          const redirect = NextResponse.redirect(url);
          supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
          return redirect;
        }
      } catch {
        // Fallback: allow access
      }
    }
  } else if (!isPublic && !isRoot) {
    const section = isRoleSection(path);
    if (section) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
      return redirect;
    }
  }

  const intlResponse = intlMiddleware(request);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });
  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
