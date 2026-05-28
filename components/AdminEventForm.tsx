"use client";

import { useActionState } from "react";

type State = { error?: string; success?: string } | undefined;

export function AdminEventForm({
  action,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      <div>
        <label htmlFor="title">Event title</label>
        <input id="title" name="title" required  />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          
        />
      </div>

      <div className="grid grid-2">
        <div>
          <label htmlFor="startAt">Start date/time</label>
          <input id="startAt" name="startAt" type="datetime-local" required />
        </div>
        <div>
          <label htmlFor="endAt">End date/time</label>
          <input id="endAt" name="endAt" type="datetime-local" required />
        </div>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="OPEN">
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
