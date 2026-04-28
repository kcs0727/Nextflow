import { clerkMiddleware } from "@clerk/nextjs/server";

// Intentionally do not call `auth.protect()` here so the app doesn't
// auto-redirect unauthenticated visitors to the Clerk sign-in page. We
// rely on server-side route handlers and explicit UI controls to protect
// sensitive endpoints and present the Sign in button instead.
export default clerkMiddleware(async () => {
  // no-op: keep middleware active for Clerk session population but
  // avoid forcing redirects on public pages.
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
