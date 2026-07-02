import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getClubLeaderboard, getMemberDashboardData } from "@/lib/member-dashboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [leaderboard, data] = await Promise.all([
    getClubLeaderboard(100),
    getMemberDashboardData(user.id),
  ]);

  const myRank = leaderboard.find((row) => row.userId === user.id);
  const podium = leaderboard.slice(0, 3);

  return (
    <section className="member-feature-page">
      <div className="feature-hero leaderboard-hero">
        <div>
          <span className="eyebrow">Leaderboard</span>
          <h1>Club ranking</h1>
          <p>Ranking is based on approved points. Ties are sorted by approved distance.</p>
        </div>
        <div className="feature-hero-score">
          <strong>{myRank ? `#${myRank.rank}` : "—"}</strong>
          <span>my rank</span>
        </div>
      </div>

      <div className="leaderboard-podium">
        {podium.map((row) => (
          <article key={row.userId} className={row.userId === user.id ? "is-me" : ""}>
            <span>#{row.rank}</span>
            <strong>{row.name}</strong>
            <small>{row.totalPoints} pts · {row.totalDistance.toFixed(1)}km</small>
          </article>
        ))}
      </div>

      <section className="member-card-section">
        <div className="section-title-row compact">
          <div>
            <span className="eyebrow">Ranking table</span>
            <h2>All runners</h2>
          </div>
          <span className="badge success">{data.totalPoints} my points</span>
        </div>
        <div className="table-scroll leaderboard-table-card">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Runner</th>
                <th>Runs</th>
                <th>Distance</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.userId} className={row.userId === user.id ? "is-me" : ""}>
                  <td><strong>#{row.rank}</strong></td>
                  <td>{row.name}</td>
                  <td>{row.approvedRuns}</td>
                  <td>{row.totalDistance.toFixed(2)}km</td>
                  <td><strong>{row.totalPoints}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaderboard.length === 0 && <p className="muted">No approved submissions yet.</p>}
      </section>
    </section>
  );
}
