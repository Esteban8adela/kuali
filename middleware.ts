import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const publicPaths = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(en|es)(\/|$)/);
  const locale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";

  const isPublic = publicPaths.some((p) => pathWithoutLocale.startsWith(p));
  const isRoot = pathWithoutLocale === "/" || pathWithoutLocale === "";

  const supabaseResponse = await updateSession(request);

  if (!isPublic && !isRoot) {
    const hasAuth =
      request.cookies.getAll().some((c) => c.name.includes("auth-token")) ||
      request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

    if (!hasAuth && pathWithoutLocale.startsWith("/guest")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
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
