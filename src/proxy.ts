import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Kept self-contained: Proxy runs separately from the render code (Next docs), so it does not
// import shared modules. Keep this pattern in sync with PAYMENT_ID_PATTERN in the domain layer.
const PAYMENT_ID = /^pi_[A-Za-z0-9]{24}$/;

function decode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/**
 * Malformed payment ids (including path-traversal style input) get a real 404 status before any
 * rendering. Well-formed ids that do not exist are resolved by the page, which streams, so
 * those responses keep status 200 with the not-found UI and a noindex robots tag.
 */
export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.slice("/payments/".length);
  const id = decode(segment);
  if (id === null || !PAYMENT_ID.test(id)) {
    return NextResponse.rewrite(new URL("/not-found-404", request.url), {
      status: 404,
    });
  }
  return NextResponse.next();
}

export const config = {
  // `export` is the CSV route handler, not a payment id.
  matcher: "/payments/((?!export$)[^/]+)",
};
