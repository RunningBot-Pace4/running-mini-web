"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/app/account/actions";

type State =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} className="form-stack" action={formAction}>
      <div>
        <label htmlFor="currentPassword">Old password</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter old password"
        />
      </div>

      <div>
        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Enter new password"
        />
        <p className="field-help">Use at least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Enter confirm new password"
        />
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? (
          <span className="button-loading">
            <span className="spinner" aria-hidden="true" />
            Updating...
          </span>
        ) : (
          "Change password"
        )}
      </button>
    </form>
  );
}
