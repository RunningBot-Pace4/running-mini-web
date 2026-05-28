import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <span className="eyebrow">Join the team</span>
        <h1>Create account</h1>
        <p className="muted">Vote attendance, connect Strava and submit runs for points.</p>
        <AuthForm mode="register" action={registerAction} />
      </div>
    </div>
  );
}
