import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { requestPasswordResetAction } from "@/app/auth/password-actions";

export default function ForgotPasswordPage() {
  return (
    <div className="card">
      <h1>Forgot password</h1>
      <p className="muted">Enter your registered email to create a password reset link.</p>
      <ForgotPasswordForm action={requestPasswordResetAction} />
      <p className="muted auth-help">
        Remember your password? <Link href="/login">Back to login</Link>.
      </p>
    </div>
  );
}
