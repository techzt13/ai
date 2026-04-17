/**
 * NextAuth.js (Auth.js v5) configuration.
 *
 * Uses the GitHub OAuth provider to gate the chat UI.  Note that this
 * token is *only* used to authenticate users of the app — it is **not**
 * the token used to talk to Copilot (see src/lib/copilot.ts).
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Gate every page and API route behind a valid session.
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      // Always allow NextAuth & the login page.
      if (pathname.startsWith("/api/auth") || pathname.startsWith("/login")) {
        return true;
      }
      return Boolean(session?.user);
    },
  },
});
