import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "massar-chat-secret-key-2024"
);

const publicPaths = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/seed", "/api/health"];

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Root path redirects to dashboard
  if (pathname === "/") {
    const token = request.cookies.get("session")?.value;
    if (token) {
      const user = await verifySession(token);
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // API routes without auth return 401
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const user = await verifySession(token);
    if (!user) {
      return NextResponse.json({ error: "Session expirée" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes - check for valid session, redirect to login if not
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifySession(token);
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
