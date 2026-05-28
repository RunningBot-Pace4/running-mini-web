import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { resetPasswordAction } from "@/app/auth/password-actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParams ? await searchParams : {};
  const token = typeof query.token === "string" ? query.token : "";

  if (!token) {
    return (
      <div className="card">
        <h1>Reset password</h1>
        <p className="error">Missing password reset token.</p>
        <Link className="button" href="/forgot-password">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Reset password</h1>
      <p className="muted">Enter your new password.</p>
      <ResetPasswordForm token={token} action={resetPasswordAction} />
    </div>
  );
}
