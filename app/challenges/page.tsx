import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMemberDashboardData } from "@/lib/member-dashboard";
import { LoadingLink } from "@/components/LoadingLink";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getMemberDashboardData(user.id);
  const activeChallenges = data.challenges.filter((challenge) => !challenge.completed);
  const completedChallenges = data.challenges.filter((challenge) => challenge.completed);
  const featured = activeChallenges[0] || completedChallenges[0];

  return (
    <section className="member-feature-page">
      <div className="feature-hero compact">
        <div>
          <span className="eyebrow">Challenge</span>
          <h1>Active missions</h1>
          <p>Clear, simple goals for check-ins, distance, approved sessions and points.</p>
        </div>
        <div className="feature-hero-score">
          <strong>{activeChallenges.length}</strong>
          <span>active now</span>
        </div>
      </div>

      {featured && (
        <article className="challenge-spotlight-card">
          <span className="eyebrow">Next best mission</span>
          <h2>{featured.title}</h2>
          <p>{featured.description}</p>
          <div className="challenge-progress-row">
            <strong>{featured.current}/{featured.target} {featured.unit}</strong>
            <span>{featured.progress}%</span>
          </div>
          <div className="account-progress"><i style={{ width: `${featured.progress}%` }} /></div>
          <LoadingLink className="button" href="/events">Find events</LoadingLink>
        </article>
      )}

      <section className="member-card-section">
        <div className="section-title-row compact">
          <div>
            <span className="eyebrow">Now</span>
            <h2>Current challenges</h2>
          </div>
        </div>
        <div className="challenge-card-grid">
          {activeChallenges.map((challenge) => (
            <article className="account-challenge-card" key={challenge.key}>
              <div>
                <strong>{challenge.title}</strong>
                <p>{challenge.description}</p>
              </div>
              <span>{challenge.current}/{challenge.target} {challenge.unit}</span>
              <div className="account-progress"><i style={{ width: `${challenge.progress}%` }} /></div>
            </article>
          ))}
        </div>
        {activeChallenges.length === 0 && <p className="muted">All current missions completed. Great work.</p>}
      </section>

      <section className="member-card-section">
        <div className="section-title-row compact">
          <div>
            <span className="eyebrow">Done</span>
            <h2>Completed challenges</h2>
          </div>
        </div>
        <div className="challenge-card-grid compact">
          {completedChallenges.map((challenge) => (
            <article className="account-challenge-card completed" key={challenge.key}>
              <div>
                <strong>{challenge.title}</strong>
                <p>{challenge.description}</p>
              </div>
              <span>Completed</span>
              <div className="account-progress"><i style={{ width: "100%" }} /></div>
            </article>
          ))}
        </div>
        {completedChallenges.length === 0 && <p className="muted">Completed challenges will appear here.</p>}
      </section>
    </section>
  );
}
