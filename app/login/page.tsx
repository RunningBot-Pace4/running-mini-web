import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="card">
      <h1>Login</h1>
      <p className="muted">Continue to your running events.</p>
      <AuthForm mode="login" action={loginAction} />
      <p className="muted auth-help">
        Forgot your password? <Link href="/forgot-password">Reset it here</Link>.
      </p>
    </div>
  );
}
