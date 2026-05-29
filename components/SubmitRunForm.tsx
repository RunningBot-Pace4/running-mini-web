"use client";

import { useActionState, useState } from "react";

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
  stravaAction,
  manualAction,
  disabled = false,
  canSubmit = true,
  blockedReason,
}: {
  eventId: string;
  activities: Activity[];
  stravaAction: (state: State, formData: FormData) => Promise<State>;
  manualAction: (state: State, formData: FormData) => Promise<State>;
  disabled?: boolean;
  canSubmit?: boolean;
  blockedReason?: string;
}) {
  const [method, setMethod] = useState<"strava" | "manual">("strava");
  const [stravaState, stravaFormAction, stravaPending] = useActionState(stravaAction, undefined);
  const [manualState, manualFormAction, manualPending] = useActionState(manualAction, undefined);

  if (!canSubmit) {
    return (
      <div className="submit-blocked">
        <p className="error">{blockedReason || "Please vote ATTEND before submitting your distance."}</p>
      </div>
    );
  }

  return (
    <div className="submit-run-shell">
      <div className="method-toggle" role="tablist" aria-label="Distance submission method">
        <button
          type="button"
          className={method === "strava" ? "is-active" : ""}
          onClick={() => setMethod("strava")}
        >
          Use Strava
        </button>
        <button
          type="button"
          className={method === "manual" ? "is-active" : ""}
          onClick={() => setMethod("manual")}
        >
          Manual distance
        </button>
      </div>

      {method === "strava" ? (
        <form className="form-stack" action={stravaFormAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <label htmlFor="activityId">Strava run</label>
            <select id="activityId" name="activityId" required>
              <option value="">Choose a synced run</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name} · {(activity.distanceMeters / 1000).toFixed(2)}km ·{" "}
                  {new Date(activity.startDate).toLocaleDateString("en-GB")}
                </option>
              ))}
            </select>
          </div>

          {disabled && <p className="error">This event is closed. New run submissions are disabled.</p>}

          {activities.length === 0 && (
            <p className="muted">No synced runs found yet. Connect Strava, then sync event runs.</p>
          )}

          {stravaState?.error && <p className="error">{stravaState.error}</p>}
          {stravaState?.success && <p className="success-text">{stravaState.success}</p>}

          <button type="submit" disabled={stravaPending || disabled || activities.length === 0}>
            {stravaPending ? (
              <span className="button-loading">
                <span className="spinner" aria-hidden="true" />
                Submitting...
              </span>
            ) : (
              "Submit Strava run"
            )}
          </button>
        </form>
      ) : (
        <form className="form-stack" action={manualFormAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <label htmlFor="manualDistanceKm">Distance completed (km)</label>
            <input
              id="manualDistanceKm"
              name="distanceKm"
              type="number"
              min="0.01"
              max="200"
              step="0.01"
              inputMode="decimal"
              required
            />
            <p className="field-help">Use manual distance only when Strava is unavailable.</p>
          </div>

          {disabled && <p className="error">This event is closed. New run submissions are disabled.</p>}

          {manualState?.error && <p className="error">{manualState.error}</p>}
          {manualState?.success && <p className="success-text">{manualState.success}</p>}

          <button type="submit" disabled={manualPending || disabled}>
            {manualPending ? (
              <span className="button-loading">
                <span className="spinner" aria-hidden="true" />
                Submitting...
              </span>
            ) : (
              "Submit manual distance"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
