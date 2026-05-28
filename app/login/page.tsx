import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1>Login</h1>
        <p className="muted">Continue to your running events and Strava submissions.</p>
        <AuthForm mode="login" action={loginAction} />
        <p className="muted auth-help">
          Forgot your password? <Link href="/forgot-password">Reset it here</Link>.
        </p>
      </div>
    </div>
  );
}
