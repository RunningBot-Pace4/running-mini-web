import { prisma } from "./prisma";

export const HOME_CONTENT_KEY = "home";

export const DEFAULT_HOME_CONTENT = {
  brandName: "Run Mini",
  brandMark: "↗",
  logoImageDataUrl: null as string | null,
  themePrimary: "#1d6fa3",
  themeSecondary: "#ff7a45",
  themeBackground: "#f8fbfd",
  themeDark: "#0b1f33",
  heroEyebrow: "Coastal running challenge",
  heroTitle: "Sweat with the sunrise.\nRun by the sea.",
  heroDescription:
    "A mobile running club experience built for discipline, consistency, and team energy. Vote attendance, submit distance, collect points, and grow stronger together.",
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
