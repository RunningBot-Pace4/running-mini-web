import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="card">
      <h1>Login</h1>
      <p className="muted">Continue to your running events.</p>
      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
