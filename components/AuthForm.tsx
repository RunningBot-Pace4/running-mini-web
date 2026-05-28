"use client";

import { useActionState } from "react";

type State = { error?: string } | undefined;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      {mode === "register" && (
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required placeholder="Your name" autoComplete="name" />
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          placeholder={mode === "register" ? "At least 8 characters" : "Password"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </div>

      {state?.error && <p className="error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Please wait..." : mode === "register" ? "Register" : "Login"}
      </button>
    </form>
  );
}
