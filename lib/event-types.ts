export type ClubEventType = "RUNNING" | "HYROX" | "REDLINE" | "MARATHON" | "TRAINING" | "RECOVERY" | "OTHER";

export const CLUB_EVENT_TYPES: Array<{
  key: ClubEventType;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}> = [
  { key: "RUNNING", label: "Running", shortLabel: "Run", icon: "🏃", description: "Easy runs, intervals, tempo sessions and distance work." },
  { key: "HYROX", label: "HYROX", shortLabel: "HYROX", icon: "🔥", description: "Functional fitness, stations, carries, sled work and engine training." },
  { key: "REDLINE", label: "Redline", shortLabel: "Redline", icon: "⚡", description: "Team relay, high-intensity stations and all-out race prep." },
  { key: "MARATHON", label: "Marathon", shortLabel: "Marathon", icon: "🏅", description: "Long runs, clinics, race prep and pacing practice." },
  { key: "TRAINING", label: "Training", shortLabel: "Train", icon: "💪", description: "Strength, conditioning, drills, mobility and club workout blocks." },
  { key: "RECOVERY", label: "Recovery", shortLabel: "Recover", icon: "🌿", description: "Mobility, recovery, wellness and active-rest sessions." },
  { key: "OTHER", label: "Others", shortLabel: "Other", icon: "✨", description: "Social sessions, special challenges and custom club events." },
];

export function getClubEventType(type: string | null | undefined) {
  return CLUB_EVENT_TYPES.find((item) => item.key === type) || CLUB_EVENT_TYPES[0];
}

export function eventTypeClass(type: string | null | undefined) {
  const key = getClubEventType(type).key.toLowerCase();
  return `event-type-chip type-${key}`;
}
