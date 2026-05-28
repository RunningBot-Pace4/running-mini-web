export function calculateScore(distanceMeters: number) {
  const distanceKm = distanceMeters / 1000;
  const completedKm = Math.floor(distanceKm);
  const attendancePoints = 1;
  const distancePoints = completedKm * 2;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    attendancePoints,
    distancePoints,
    totalPoints: attendancePoints + distancePoints,
  };
}
