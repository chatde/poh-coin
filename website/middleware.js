import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "");

  if (host === "projectpoh.org" || host === "www.projectpoh.org") {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://projectpoh.com");
    return NextResponse.redirect(url, 301);
  }
}
