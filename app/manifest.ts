import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Run Mini",
    short_name: "Run Mini",
    description: "Mobile running club challenge, attendance voting, scoring, Strava sync and sharing.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f8fbfd",
    theme_color: "#1d6fa3",
    orientation: "portrait",
    categories: ["sports", "health", "fitness"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Events",
        short_name: "Events",
        description: "Open the running event board",
        url: "/?source=pwa-shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "My Account",
        short_name: "Account",
        description: "View runner points and submissions",
        url: "/account?source=pwa-shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}
