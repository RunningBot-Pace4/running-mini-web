"use client";

import { useActionState } from "react";

type State = { error?: string; success?: string } | undefined;

type ScoreSettings = {
  attendancePoints: number;
  perKmPoints: number;
};

export function ScoreSettingsForm({
  settings,
  action,
}: {
  settings: ScoreSettings;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      <div className="grid grid-2">
        <div>
          <label htmlFor="attendancePoints">Attendance vote points</label>
          <input
            id="attendancePoints"
            name="attendancePoints"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            defaultValue={settings.attendancePoints}
          />
        </div>

        <div>
          <label htmlFor="perKmPoints">Points per completed 1km</label>
          <input
            id="perKmPoints"
            name="perKmPoints"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            defaultValue={settings.perKmPoints}
          />
        </div>
      </div>

      <p className="muted">
        Example: attendance {settings.attendancePoints} + floor(distance km) × {settings.perKmPoints}. This applies to new or resubmitted runs.
      </p>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save scoring rules"}
      </button>
    </form>
  );
}
