import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <div className="card">
      <h1>Create account</h1>
      <p className="muted">Use this account to vote, connect Strava and submit runs.</p>
      <AuthForm mode="register" action={registerAction} />
    </div>
  );
}
