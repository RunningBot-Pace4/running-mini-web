"use client";

import { useActionState } from "react";
import { RichDescriptionEditor } from "@/components/RichDescriptionEditor";

type State = { error?: string; success?: string } | undefined;

type HomeContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

export function HomeContentForm({
  content,
  action,
}: {
  content: HomeContent;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form className="form-stack" action={formAction}>
      <div>
        <label htmlFor="heroEyebrow">Small heading</label>
        <input
          id="heroEyebrow"
          name="heroEyebrow"
          required
          defaultValue={content.heroEyebrow}
        />
      </div>

      <div>
        <label htmlFor="heroTitle">Home title</label>
        <textarea
          id="heroTitle"
          name="heroTitle"
          required
          rows={3}
          defaultValue={content.heroTitle}
        />
        <p className="muted editor-help">Line breaks are supported for the large home title.</p>
      </div>

      <div>
        <label htmlFor="heroDescription">Home description</label>
        <RichDescriptionEditor
          id="heroDescription"
          name="heroDescription"
          rows={7}
          defaultValue={content.heroDescription}
        />
      </div>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save home content"}
      </button>
    </form>
  );
}
