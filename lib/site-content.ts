import { prisma } from "./prisma";

export const HOME_CONTENT_KEY = "home";

export const DEFAULT_HOME_CONTENT = {
  brandName: "Run Mini",
  brandMark: "↗",
  themePrimary: "#ff5a1f",
  themeSecondary: "#ffb000",
  themeBackground: "#fff8ec",
  themeDark: "#15120f",
  heroEyebrow: "Mobile running challenge",
  heroTitle: "Run. Vote. Sync. Score.",
  heroDescription:
    "Join club sessions, confirm attendance, submit Strava runs, climb the leaderboard, and share your finish with the team.",
};

export async function getHomeContent() {
  const content = await prisma.siteContent.findUnique({
    where: { key: HOME_CONTENT_KEY },
  });

  return (
    content || {
      id: "",
      key: HOME_CONTENT_KEY,
      ...DEFAULT_HOME_CONTENT,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
  );
}
