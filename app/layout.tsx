import type { Metadata } from "next";
import Link from "next/link";
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
            <Link className="brand" href="/">
              Run Mini
            </Link>
            <nav className="nav">
              <Link href="/">Events</Link>
              {user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
              {user ? (
                <form action={logoutAction}>
                  <button className="ghost" type="submit">
                    Logout
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/login">Login</Link>
                  <Link className="button" href="/register">
                    Register
                  </Link>
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
