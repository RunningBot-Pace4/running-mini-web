import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { LoadingLink } from "@/components/LoadingLink";
import { LogoutForm } from "@/components/LogoutForm";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/app/auth/actions";
import { getHomeContent } from "@/lib/site-content";
import { getThemePreset } from "@/lib/theme-presets";

export const metadata: Metadata = {
  title: "Performance Club Hub",
  description: "Performance club loyalty hub with events, points, badges, rewards and redemptions.",
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
  const preset = getThemePreset(content.themePreset);

  // The site now uses fixed presets. Always derive the visible theme from
  // themePreset so old/stale color columns cannot prevent the selected theme
  // from showing on the public pages.
  const primary = preset.primary;
  const secondary = preset.secondary;
  const background = preset.background;
  const dark = preset.dark;

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
  const brandName = (siteContent.brandName || "").trim() || "Run Mini";
  const brandMark = (siteContent.brandMark || "").trim() || "↗";
  const logoImageDataUrl = siteContent.logoImageDataUrl || "";

  return (
    <html lang="en">
      <body style={buildThemeStyle(siteContent)} data-theme-preset={siteContent.themePreset || "coastal-sunrise"}>
        <header className="topbar cn-topbar">
          <div className="topbar-inner cn-topbar-inner modern-topbar-inner">
            <LoadingLink className="brand cn-brand coastal-brand" href="/" aria-label={`${brandName} home`} loadingLabel="Opening dashboard...">
              <span className="brand-mark cn-brand-mark coastal-brand-mark">
                {logoImageDataUrl ? <img src={logoImageDataUrl} alt="" /> : brandMark}
              </span>
              <span className="brand-name">{brandName}</span>
            </LoadingLink>

            <div className="topbar-right">
              <nav className="nav cn-nav primary-nav" aria-label="Main navigation">
                <LoadingLink href="/" loadingLabel="Opening dashboard...">Dashboard</LoadingLink>
                <LoadingLink href="/events" loadingLabel="Opening events...">Events</LoadingLink>
                {user && <LoadingLink href="/redemptions" loadingLabel="Opening rewards...">Redeem</LoadingLink>}
                {user?.role === "ADMIN" && <LoadingLink href="/admin" loadingLabel="Opening admin...">Admin</LoadingLink>}
              </nav>

              {user ? (
                <details className="account-menu">
                  <summary aria-label="Open account menu">
                    <span className="account-menu-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                    <span className="account-menu-name">{user.name}</span>
                    <span className="account-menu-caret">⌄</span>
                  </summary>
                  <div className="account-menu-panel">
                    <div className="account-menu-user">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <LoadingLink href="/account" loadingLabel="Opening account...">My account</LoadingLink>
                    <LogoutForm action={logoutAction} className="account-menu-logout" pendingLabel="Logging out..." />
                  </div>
                </details>
              ) : (
                <div className="guest-nav-actions">
                  <LoadingLink href="/login" loadingLabel="Opening login...">Login</LoadingLink>
                  <LoadingLink className="button nav-button cn-register-pill" href="/register" loadingLabel="Opening registration...">
                    Register
                  </LoadingLink>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container cn-container">{children}</main>

        <nav className="cn-mobile-tabbar modern-mobile-tabbar" aria-label="Mobile app navigation">
          <LoadingLink href="/" loadingLabel="Opening dashboard...">
            <span>🏠</span>
            Dashboard
          </LoadingLink>
          <LoadingLink href="/events" loadingLabel="Opening events...">
            <span>📅</span>
            Events
          </LoadingLink>
          {user ? (
            <LoadingLink href="/redemptions" loadingLabel="Opening rewards...">
              <span>🎁</span>
              Redeem
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
            <LoadingLink href={user ? "/account" : "/register"} loadingLabel={user ? "Opening account..." : "Opening registration..."}>
              <span>{user ? "👤" : "🔥"}</span>
              {user ? "Account" : "Join"}
            </LoadingLink>
          )}
        </nav>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
