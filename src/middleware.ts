import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const adminPaths = ["/admin"]
const kidsPaths = ["/kids"]
const protectedPaths = [...adminPaths, ...kidsPaths]
const publicPaths = ["/login", "/register", "/register-auth", "/forbidden"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (!isProtected) return NextResponse.next()

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value ??
    request.cookies.get("next-auth.session-token")?.value ??
    request.cookies.get("__Secure-next-auth.session-token")?.value

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
