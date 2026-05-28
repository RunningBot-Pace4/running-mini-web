"use client";

import { useActionState, useEffect, useState } from "react";

type State = { error?: string } | undefined;

const REMEMBERED_EMAIL_KEY = "running-mini-web-remembered-email";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [email, setEmail] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    if (mode !== "login") return;

    const remembered = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, [mode]);

  function handleSubmit() {
    if (mode !== "login") return;

    if (rememberEmail && email) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  }

  return (
    <form className="form-stack" action={formAction} onSubmit={handleSubmit}>
      {mode === "register" && (
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required placeholder="Your name" autoComplete="name" />
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
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

      {mode === "login" && (
        <label className="check-row">
          <input
            name="rememberEmail"
            type="checkbox"
            checked={rememberEmail}
            onChange={(event) => setRememberEmail(event.target.checked)}
          />
          <span>Remember my email on this device</span>
        </label>
      )}

      {state?.error && <p className="error">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Please wait..." : mode === "register" ? "Register" : "Login"}
      </button>
    </form>
  );
}
