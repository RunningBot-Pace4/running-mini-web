export type ThemePresetKey =
  | "coastal-sunrise"
  | "ocean-velocity"
  | "sweat-orange"
  | "midnight-run"
  | "forest-trail"
  | "desert-dawn"
  | "neon-track"
  | "clean-sky"
  | "coral-energy"
  | "royal-marathon";

export type ThemePreset = {
  key: ThemePresetKey;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  primary: string;
  secondary: string;
  background: string;
  dark: string;
};

export const DEFAULT_THEME_PRESET: ThemePresetKey = "coastal-sunrise";

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "coastal-sunrise",
    name: "Coastal Sunrise",
    shortName: "Sunrise",
    tagline: "Sky, sea and morning sweat",
    description: "Fresh blue sea base with sunrise orange energy.",
    primary: "#1d6fa3",
    secondary: "#ff7a45",
    background: "#f8fbfd",
    dark: "#0b1f33",
  },
  {
    key: "ocean-velocity",
    name: "Ocean Velocity",
    shortName: "Ocean",
    tagline: "Cool water, fast pace",
    description: "Premium ocean blue with aqua highlights.",
    primary: "#0077b6",
    secondary: "#00b4d8",
    background: "#edfaff",
    dark: "#023047",
  },
  {
    key: "sweat-orange",
    name: "Sweat Orange",
    shortName: "Sweat",
    tagline: "Heat, grind and effort",
    description: "High-energy orange for intense workouts.",
    primary: "#f97316",
    secondary: "#fb923c",
    background: "#fff7ed",
    dark: "#431407",
  },
  {
    key: "midnight-run",
    name: "Midnight Run",
    shortName: "Night",
    tagline: "Night race premium mode",
    description: "Dark sport theme with electric cyan accents.",
    primary: "#22d3ee",
    secondary: "#a78bfa",
    background: "#0f172a",
    dark: "#020617",
  },
  {
    key: "forest-trail",
    name: "Forest Trail",
    shortName: "Trail",
    tagline: "Green route, steady rhythm",
    description: "Nature green for trail and endurance clubs.",
    primary: "#16a34a",
    secondary: "#84cc16",
    background: "#f0fdf4",
    dark: "#052e16",
  },
  {
    key: "desert-dawn",
    name: "Desert Dawn",
    shortName: "Dawn",
    tagline: "Warm sand and sunrise miles",
    description: "Soft sand background with bold sunrise amber.",
    primary: "#c2410c",
    secondary: "#facc15",
    background: "#fffbeb",
    dark: "#451a03",
  },
  {
    key: "neon-track",
    name: "Neon Track",
    shortName: "Neon",
    tagline: "Arcade race day energy",
    description: "Bold dark track with neon pink and blue.",
    primary: "#ec4899",
    secondary: "#06b6d4",
    background: "#111827",
    dark: "#030712",
  },
  {
    key: "clean-sky",
    name: "Clean Sky",
    shortName: "Sky",
    tagline: "Minimal, calm and premium",
    description: "Clean light theme for corporate running events.",
    primary: "#2563eb",
    secondary: "#38bdf8",
    background: "#f8fafc",
    dark: "#0f172a",
  },
  {
    key: "coral-energy",
    name: "Coral Energy",
    shortName: "Coral",
    tagline: "Lifestyle running club feel",
    description: "Coral and magenta for a social challenge vibe.",
    primary: "#f43f5e",
    secondary: "#fb7185",
    background: "#fff1f2",
    dark: "#4c0519",
  },
  {
    key: "royal-marathon",
    name: "Royal Marathon",
    shortName: "Royal",
    tagline: "Elite race and medal mood",
    description: "Royal purple with gold reward highlights.",
    primary: "#7c3aed",
    secondary: "#f59e0b",
    background: "#faf5ff",
    dark: "#2e1065",
  },
];

export function getThemePreset(key?: string | null): ThemePreset {
  return THEME_PRESETS.find((theme) => theme.key === key) || THEME_PRESETS[0];
}

export function isThemePresetKey(value: unknown): value is ThemePresetKey {
  return typeof value === "string" && THEME_PRESETS.some((theme) => theme.key === value);
}
