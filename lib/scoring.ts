import { prisma } from "./prisma";
import { DEFAULT_SCORE_SETTING, SCORE_SETTING_KEY, type ScoreSettingValues } from "./score-config";

export { DEFAULT_SCORE_SETTING, SCORE_SETTING_KEY };
export type { ScoreSettingValues };

export async function getScoreSettings(): Promise<ScoreSettingValues> {
  const setting = await prisma.scoreSetting.findUnique({
    where: { key: SCORE_SETTING_KEY },
  });

  if (!setting) return DEFAULT_SCORE_SETTING;

  return {
    attendancePoints: setting.attendancePoints,
    perKmPoints: setting.perKmPoints,
  };
}

export function scoringFormulaLabel(settings: ScoreSettingValues) {
  return `${settings.attendancePoints} + ${settings.perKmPoints}/km`;
}

export function scoringDescription(settings: ScoreSettingValues) {
  return `Attend = ${settings.attendancePoints} point${settings.attendancePoints === 1 ? "" : "s"} · Every completed 1km = ${settings.perKmPoints} point${settings.perKmPoints === 1 ? "" : "s"}`;
}

export function calculateScore(distanceMeters: number, settings: ScoreSettingValues = DEFAULT_SCORE_SETTING) {
  const distanceKm = distanceMeters / 1000;
  const completedKm = Math.floor(distanceKm);
  const attendancePoints = settings.attendancePoints;
  const distancePoints = completedKm * settings.perKmPoints;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    attendancePoints,
    distancePoints,
    totalPoints: attendancePoints + distancePoints,
  };
}
