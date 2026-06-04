import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { LoadingLink } from "@/components/LoadingLink";
import { LogoutForm } from "@/components/LogoutForm";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/auth/actions";
import { getHomeContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Run Mini Web",
  description: "Mobile running event, Strava sync, scoring and sharing.",
  manifest: "/manifest.webmanifest",
  themeColor: "#ff5a1f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Run Mini"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};



type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function buildThemeStyle(content: Awaited<ReturnType<typeof getHomeContent>>): ThemeStyle {
  const primary = content.themePrimary || "#ff5a1f";
  const secondary = content.themeSecondary || "#ffb000";
  const background = content.themeBackground || "#fff8ec";
  const dark = content.themeDark || "#15120f";

  return {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-dark": primary,
    "--bg": background,
    "--bg-2": background,
    "--ink": dark,
    "--text": dark,
    "--cn-red": primary,
    "--cn-orange": secondary,
    "--cn-gold": secondary,
    "--cn-gold-2": secondary,
    "--cn-ink": dark,
    "--cn-deep": dark,
    "--cn-paper": background,
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-background": background,
    "--brand-dark": dark,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, siteContent] = await Promise.all([getCurrentUser(), getHomeContent()]);
  const brandName = siteContent.brandName || "Run Mini";
  const brandMark = siteContent.brandMark || "↗";

  return (
    <html lang="en">
      <body style={buildThemeStyle(siteContent)}>
        <header className="topbar cn-topbar">
          <div className="topbar-inner cn-topbar-inner">
            <LoadingLink className="brand cn-brand" href="/" aria-label="Run Mini home" loadingLabel="Opening home...">
              <span className="brand-mark cn-brand-mark">{brandMark}</span>
              <span>{brandName}</span>
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
          {user && (
            <LogoutForm action={logoutAction} className="cn-mobile-logout-button" pendingLabel="Logging out...">
              <span>🚪</span>
              Logout
            </LogoutForm>
          )}
        </nav>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
