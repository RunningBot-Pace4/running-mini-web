"use client";

import { useActionState } from "react";

type Activity = {
  id: string;
  name: string;
  distanceMeters: number;
  startDate: Date;
};

type State = { error?: string; success?: string } | undefined;

export function SubmitRunForm({
  eventId,
  activities,
  action,
  disabled = false,
}: {
  eventId: string;
  activities: Activity[];
  action: (state: State, formData: FormData) => Promise<State>;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label htmlFor="activityId">Strava run</label>
        <select id="activityId" name="activityId" required>
          <option value="">Choose a synced run</option>
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.name} · {(activity.distanceMeters / 1000).toFixed(2)}km ·{" "}
              {new Date(activity.startDate).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {disabled && <p className="error">This event is closed. New run submissions are disabled.</p>}

      {activities.length === 0 && (
        <p className="muted">No synced runs found yet. Connect Strava, then sync event runs.</p>
      )}

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending || disabled || activities.length === 0}>
        {pending ? "Submitting..." : "Submit activity"}
      </button>
    </form>
  );
}
