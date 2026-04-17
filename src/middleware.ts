// Enables the `authorized` callback in auth.ts to protect every route
// (except /api/auth/* and /login) with a single middleware.
export { auth as middleware } from "@/auth";

export const config = {
  // Run on every route except static assets and the NextAuth internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
