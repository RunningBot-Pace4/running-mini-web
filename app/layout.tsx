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
        <header className="topbar">
          <div className="topbar-inner">
            <LoadingLink className="brand" href="/" aria-label="Run Mini home" loadingLabel="Opening home...">
              <span className="brand-mark">↗</span>
              <span>Run Mini</span>
            </LoadingLink>
            <nav className="nav">
              <LoadingLink href="/">Events</LoadingLink>
              {user && <LoadingLink href="/account">Account</LoadingLink>}
              {user?.role === "ADMIN" && <LoadingLink href="/admin">Admin</LoadingLink>}
              {user ? (
                <LogoutForm action={logoutAction} />
              ) : (
                <>
                  <LoadingLink href="/login">Login</LoadingLink>
                  <LoadingLink className="button nav-button" href="/register">
                    Register
                  </LoadingLink>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
