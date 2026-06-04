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
  themeColor: "#1d6fa3",
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
  const primary = content.themePrimary || "#1d6fa3";
  const secondary = content.themeSecondary || "#ff7a45";
  const background = content.themeBackground || "#f8fbfd";
  const dark = content.themeDark || "#0b1f33";

  return {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-dark": primary,
    "--bg": background,
    "--bg-2": background,
    "--ink": dark,
    "--text": dark,
    "--cn-red": secondary,
    "--cn-orange": secondary,
    "--cn-gold": secondary,
    "--cn-gold-2": "#ffd166",
    "--cn-ink": dark,
    "--cn-deep": dark,
    "--cn-paper": background,
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-background": background,
    "--brand-dark": dark,
    "--sky": "#6ec6ff",
    "--sea": primary,
    "--sunrise": secondary,
    "--mist": "#dde7f0",
    "--sand": "#f8fbfd",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, siteContent] = await Promise.all([getCurrentUser(), getHomeContent()]);
  const brandName = siteContent.brandName || "Run Mini";
  const brandMark = siteContent.brandMark || "↗";
  const logoImageDataUrl = siteContent.logoImageDataUrl || "";

  return (
    <html lang="en">
      <body style={buildThemeStyle(siteContent)}>
        <header className="topbar cn-topbar">
          <div className="topbar-inner cn-topbar-inner">
            <LoadingLink className="brand cn-brand coastal-brand" href="/" aria-label="Run Mini home" loadingLabel="Opening home...">
              <span className="brand-mark cn-brand-mark coastal-brand-mark">
                {logoImageDataUrl ? <img src={logoImageDataUrl} alt="" /> : brandMark}
              </span>
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
