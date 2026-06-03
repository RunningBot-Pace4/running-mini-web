import type { Metadata } from "next";
import { LoadingLink } from "@/components/LoadingLink";
import { LogoutForm } from "@/components/LogoutForm";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Run Mini Web",
  description: "Mobile running event, Strava sync, scoring and sharing.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="topbar cn-topbar">
          <div className="topbar-inner cn-topbar-inner">
            <LoadingLink className="brand cn-brand" href="/" aria-label="Run Mini home" loadingLabel="Opening home...">
              <span className="brand-mark cn-brand-mark">↗</span>
              <span>Run Mini</span>
            </LoadingLink>
            <nav className="nav cn-nav">
              <LoadingLink href="/">Events</LoadingLink>
              {user && <LoadingLink href="/account">Account</LoadingLink>}
              {user?.role === "ADMIN" && <LoadingLink href="/admin">Admin</LoadingLink>}
              {user ? (
                <LogoutForm action={logoutAction} />
              ) : (
                <>
                  <LoadingLink href="/login">Login</LoadingLink>
                  <LoadingLink className="button nav-button cn-register-pill" href="/register">
                    Register
                  </LoadingLink>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="container cn-container">{children}</main>

        <nav className="cn-mobile-tabbar" aria-label="Mobile app navigation">
          <LoadingLink href="/" loadingLabel="Opening events...">
            <span>🏃</span>
            Events
          </LoadingLink>
          {user ? (
            <LoadingLink href="/account" loadingLabel="Opening account...">
              <span>🎽</span>
              Account
            </LoadingLink>
          ) : (
            <LoadingLink href="/login" loadingLabel="Opening login...">
              <span>🔐</span>
              Login
            </LoadingLink>
          )}
          {user?.role === "ADMIN" ? (
            <LoadingLink href="/admin" loadingLabel="Opening admin...">
              <span>🛠️</span>
              Admin
            </LoadingLink>
          ) : (
            <LoadingLink href="/register" loadingLabel="Opening registration...">
              <span>🔥</span>
              Join
            </LoadingLink>
          )}
        </nav>
      </body>
    </html>
  );
}
