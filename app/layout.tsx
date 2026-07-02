import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { LoadingLink } from "@/components/LoadingLink";
import { AccountMenu } from "@/components/AccountMenu";
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
    title: "Run Mini",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function buildThemeStyle(content: Awaited<ReturnType<typeof getHomeContent>>): ThemeStyle {
  const preset = getThemePreset(content.themePreset);
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
    "--theme-primary": primary,
    "--theme-accent": secondary,
    "--title-color": dark,
    "--muted-text": "#54657d",
    "--sky": "#6ec6ff",
    "--sea": primary,
    "--sunrise": secondary,
    "--mist": "#dde7f0",
    "--sand": "#f8fbfd",
  };
}

function BrandLogo({
  brandName,
  brandMark,
  logoImageDataUrl,
}: {
  brandName: string;
  brandMark: string;
  logoImageDataUrl: string;
}) {
  return (
    <LoadingLink className="loyalty-brand brand" href="/" aria-label={`${brandName} home`} loadingLabel="Opening dashboard...">
      <span className="loyalty-brand-mark brand-mark">
        {logoImageDataUrl ? <img src={logoImageDataUrl} alt="" /> : brandMark}
      </span>
      <span className="brand-name">{brandName}</span>
    </LoadingLink>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, siteContent] = await Promise.all([getCurrentUser(), getHomeContent()]);
  const brandName = (siteContent.brandName || "").trim() || "Super Pogi Rockstars Club";
  const brandMark = (siteContent.brandMark || "").trim() || "⭐";
  const logoImageDataUrl = siteContent.logoImageDataUrl || "";

  return (
    <html lang="en">
      <body style={buildThemeStyle(siteContent)} data-theme-preset={siteContent.themePreset || "coastal-sunrise"}>
        <div className="loyalty-app-shell">
          <aside className="loyalty-sidebar" aria-label="Desktop navigation">
            <BrandLogo brandName={brandName} brandMark={brandMark} logoImageDataUrl={logoImageDataUrl} />

            <nav className="loyalty-side-nav">
              <LoadingLink href="/" loadingLabel="Opening dashboard..."><span>🏠</span> Dashboard</LoadingLink>
              <LoadingLink href="/events" loadingLabel="Opening events..."><span>📅</span> Events</LoadingLink>
              <LoadingLink href="/redemptions" loadingLabel="Opening rewards..."><span>🎁</span> Redeem</LoadingLink>
              {user?.role === "ADMIN" && <LoadingLink href="/admin" loadingLabel="Opening admin center..."><span>⚙️</span> Admin</LoadingLink>}
            </nav>

            {user ? (
              <div className="loyalty-sidebar-profile">
                <span>{user.name.slice(0, 2).toUpperCase()}</span>
                <div><strong>{user.name}</strong><small>{user.role === "ADMIN" ? "Administrator" : "Member"}</small></div>
              </div>
            ) : (
              <div className="loyalty-sidebar-card">
                <strong>Join the club</strong>
                <p>Vote, train, score and redeem rewards.</p>
                <LoadingLink className="button" href="/register">Register</LoadingLink>
              </div>
            )}
          </aside>

          <section className="loyalty-content-shell">
            <header className="loyalty-mobile-header">
              <BrandLogo brandName={brandName} brandMark={brandMark} logoImageDataUrl={logoImageDataUrl} />
              {user ? (
                <AccountMenu name={user.name} role={user.role} logoutAction={logoutAction} />
              ) : (
                <LoadingLink className="button ghost compact-login" href="/login" loadingLabel="Opening login...">Login</LoadingLink>
              )}
            </header>

            <header className="loyalty-page-topbar" aria-label="Page toolbar">
              <div className="loyalty-topbar-spacer" />
              {user ? (
                <AccountMenu name={user.name} role={user.role} logoutAction={logoutAction} />
              ) : (
                <div className="loyalty-auth-actions">
                  <LoadingLink href="/login">Login</LoadingLink>
                  <LoadingLink className="button" href="/register">Register</LoadingLink>
                </div>
              )}
            </header>

            <main className="loyalty-main">{children}</main>
          </section>
        </div>

        <nav className="loyalty-mobile-tabbar" aria-label="Mobile app navigation">
          <LoadingLink href="/" loadingLabel="Opening dashboard..."><span>🏠</span>Dashboard</LoadingLink>
          <LoadingLink href="/events" loadingLabel="Opening events..."><span>📅</span>Events</LoadingLink>
          <LoadingLink href="/redemptions" loadingLabel="Opening rewards..."><span>🎁</span>Redeem</LoadingLink>
          {user?.role === "ADMIN" && <LoadingLink href="/admin" loadingLabel="Opening admin center..."><span>🛡️</span>Admin</LoadingLink>}
        </nav>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
