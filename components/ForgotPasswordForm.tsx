"use client";

import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { useActionState } from "react";

type State = { error?: string; success?: string; resetUrl?: string } | undefined;

export function ForgotPasswordForm({
  action,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <>
      <PageLoadingOverlay show={pending} label="Creating reset link..." />
      <form className="form-stack" action={formAction}>
      <div>
        <label htmlFor="email">Registered email</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      {state?.resetUrl && (
        <div className="reset-link-box">
          <p className="muted">Testing reset link:</p>
          <a href={state.resetUrl}>{state.resetUrl}</a>
        </div>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Creating link..." : "Send reset link"}
      </button>
      </form>
    </>
  );
}
