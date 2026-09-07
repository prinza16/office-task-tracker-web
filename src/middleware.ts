import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ['/dashboard', '/tasks', '/teams', '/users'];
const OWNER_ONLY_PATHS = ['/teams'];
const MANAGE_PATHS = ['/users'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const role = request.cookies.get('user_role')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isOwnerOnly = OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path));
  if (isOwnerOnly && role !== 'OWNER') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const isManagePath = MANAGE_PATHS.some((path) => pathname.startsWith(path));
  if (isManagePath && role !== 'OWNER' && role !== 'SUPERVISOR') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/tasks/:path*', '/teams/:path*', '/users/:path*'],
};