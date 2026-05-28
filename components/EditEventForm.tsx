"use client";

import { useActionState } from "react";
import { RichDescriptionEditor } from "@/components/RichDescriptionEditor";

type State = { error?: string; success?: string } | undefined;

type EditableEvent = {
  id: string;
  title: string;
  description: string;
  startAtInput: string;
  endAtInput: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
};

export function EditEventForm({
  event,
  action,
}: {
  event: EditableEvent;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      <input type="hidden" name="eventId" value={event.id} />

      <div>
        <label htmlFor="edit-title">Event title</label>
        <input
          id="edit-title"
          name="title"
          required
          defaultValue={event.title}
        />
      </div>

      <div>
        <label htmlFor="edit-description">Description</label>
        <RichDescriptionEditor
          id="edit-description"
          name="description"
          rows={9}
          defaultValue={event.description}
        />
      </div>

      <div className="grid grid-2">
        <div>
          <label htmlFor="edit-startAt">Start date/time</label>
          <input
            id="edit-startAt"
            name="startAt"
            type="datetime-local"
            required
            defaultValue={event.startAtInput}
          />
        </div>
        <div>
          <label htmlFor="edit-endAt">End date/time</label>
          <input
            id="edit-endAt"
            name="endAt"
            type="datetime-local"
            required
            defaultValue={event.endAtInput}
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-status">Status</label>
        <select id="edit-status" name="status" defaultValue={event.status}>
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
