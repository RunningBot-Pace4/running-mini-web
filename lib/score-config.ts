export const SCORE_SETTING_KEY = "default";

export const DEFAULT_SCORE_SETTING = {
  attendancePoints: 1,
  perKmPoints: 2,
  requireSubmissionApproval: false,
};

export type ScoreSettingValues = {
  attendancePoints: number;
  perKmPoints: number;
  requireSubmissionApproval: boolean;
};
