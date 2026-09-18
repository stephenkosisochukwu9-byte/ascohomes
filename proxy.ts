import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /*
   * IMPORTANT:
   * getUser() verifies the authenticated user with Supabase.
   * Do not use getSession() for authorization.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * Protect EVERYTHING under /admin
   */
  if (pathname.startsWith("/admin")) {
    // Not logged in
    if (!user) {
      const loginUrl = new URL("/login", request.url);

      loginUrl.searchParams.set(
        "redirect",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    /*
     * Admin role comes from Supabase Auth app_metadata.
     */
    const role = user.app_metadata?.role;

    if (role !== "admin") {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
