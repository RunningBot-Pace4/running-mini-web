import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMemberDashboardData } from "@/lib/member-dashboard";
import { LoadingLink } from "@/components/LoadingLink";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getMemberDashboardData(user.id);
  const earnedBadges = data.badges.filter((badge) => badge.earned);
  const lockedBadges = data.badges.filter((badge) => !badge.earned);

  return (
    <section className="member-feature-page">
      <div className="feature-hero badge-hero">
        <div>
          <span className="eyebrow">My badge</span>
          <h1>Earned badges</h1>
          <p>Your personal achievement shelf. Earn more badges by joining events and submitting approved results.</p>
        </div>
        <div className="feature-hero-score">
          <strong>{earnedBadges.length}/{data.badges.length}</strong>
          <span>earned</span>
        </div>
      </div>

      <section className="member-card-section">
        <div className="section-title-row compact">
          <div>
            <span className="eyebrow">Unlocked</span>
            <h2>My earned badges</h2>
          </div>
          <LoadingLink className="button ghost" href="/challenges">View challenges</LoadingLink>
        </div>
        <div className="account-badge-grid">
          {earnedBadges.map((badge) => (
            <article className="account-badge-card earned" key={badge.key}>
              <span>{badge.icon}</span>
              <strong>{badge.name}</strong>
              <p>{badge.description}</p>
              <div className="account-progress"><i style={{ width: "100%" }} /></div>
              <small>Earned</small>
            </article>
          ))}
        </div>
        {earnedBadges.length === 0 && <p className="muted">No badges earned yet. Join an event to start.</p>}
      </section>

      <section className="member-card-section">
        <div className="section-title-row compact">
          <div>
            <span className="eyebrow">Next</span>
            <h2>Badges to unlock</h2>
          </div>
        </div>
        <div className="account-badge-grid">
          {lockedBadges.map((badge) => (
            <article className="account-badge-card locked" key={badge.key}>
              <span>{badge.icon}</span>
              <strong>{badge.name}</strong>
              <p>{badge.description}</p>
              <div className="account-progress"><i style={{ width: `${badge.progress}%` }} /></div>
              <small>{badge.progress}% progress</small>
            </article>
          ))}
        </div>
        {lockedBadges.length === 0 && <p className="muted">You unlocked every badge currently available.</p>}
      </section>
    </section>
  );
}
