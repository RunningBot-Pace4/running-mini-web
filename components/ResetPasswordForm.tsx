"use client";

import Link from "next/link";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { useActionState } from "react";

type State = { error?: string; success?: string } | undefined;

export function ResetPasswordForm({
  token,
  action,
}: {
  token: string;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <>
      <PageLoadingOverlay show={pending} label="Updating password..." />
      <form className="form-stack" action={formAction}>
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          placeholder="Confirm password"
          autoComplete="new-password"
        />
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && (
        <p className="success-text">
          {state.success} <Link href="/login">Go to login</Link>
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </button>
      </form>
    </>
  );
}
