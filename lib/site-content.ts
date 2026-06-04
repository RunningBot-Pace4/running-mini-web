import { prisma } from "./prisma";
import { DEFAULT_THEME_PRESET, getThemePreset } from "./theme-presets";

export const HOME_CONTENT_KEY = "home";

export const DEFAULT_HOME_CONTENT = {
  brandName: "Run Mini",
  brandMark: "↗",
  logoImageDataUrl: null as string | null,
  themePreset: DEFAULT_THEME_PRESET,
  themePrimary: getThemePreset(DEFAULT_THEME_PRESET).primary,
  themeSecondary: getThemePreset(DEFAULT_THEME_PRESET).secondary,
  themeBackground: getThemePreset(DEFAULT_THEME_PRESET).background,
  themeDark: getThemePreset(DEFAULT_THEME_PRESET).dark,
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
