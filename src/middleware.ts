import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and child routes
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("nexareach_session")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/dashboard API endpoints
  if (pathname.startsWith("/api/dashboard")) {
    const sessionCookie = request.cookies.get("nexareach_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*",
  ],
};
