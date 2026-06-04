"use client";

import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { useActionState, useState } from "react";
import { RichDescriptionEditor } from "@/components/RichDescriptionEditor";

type State = { error?: string; success?: string } | undefined;

type HomeContent = {
  brandName: string;
  brandMark: string;
  themePrimary: string;
  themeSecondary: string;
  themeBackground: string;
  themeDark: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

const colorFields = [
  { id: "themePrimary", label: "Primary color" },
  { id: "themeSecondary", label: "Highlight color" },
  { id: "themeBackground", label: "Background color" },
  { id: "themeDark", label: "Dark text / header color" },
] as const;

export function HomeContentForm({
  content,
  action,
}: {
  content: HomeContent;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [colors, setColors] = useState({
    themePrimary: content.themePrimary,
    themeSecondary: content.themeSecondary,
    themeBackground: content.themeBackground,
    themeDark: content.themeDark,
  });

  function setColor(id: keyof typeof colors, value: string) {
    setColors((current) => ({ ...current, [id]: value }));
  }

  return (
    <>
      <PageLoadingOverlay show={pending} label="Saving home content..." />
      <form className="form-stack" action={formAction}>
        <div className="theme-editor-card">
          <div>
            <span className="eyebrow">Brand logo</span>
            <h3>Header logo and theme</h3>
            <p className="muted">Change the logo text, icon mark, and main colors used across the web.</p>
          </div>

          <div className="grid grid-2">
            <div>
              <label htmlFor="brandName">Logo name</label>
              <input
                id="brandName"
                name="brandName"
                required
                maxLength={40}
                defaultValue={content.brandName}
              />
            </div>

            <div>
              <label htmlFor="brandMark">Logo mark / emoji</label>
              <input
                id="brandMark"
                name="brandMark"
                required
                maxLength={4}
                defaultValue={content.brandMark}
              />
              <p className="muted editor-help">Example: ↗, 🏃, ⚡, R</p>
            </div>
          </div>

          <div className="theme-color-grid">
            {colorFields.map((field) => (
              <div className="theme-color-field" key={field.id}>
                <label htmlFor={field.id}>{field.label}</label>
                <div className="color-input-row">
                  <input
                    id={field.id}
                    name={field.id}
                    type="color"
                    value={colors[field.id]}
                    onChange={(event) => setColor(field.id, event.target.value)}
                    aria-label={field.label}
                  />
                  <input
                    name={`${field.id}Text`}
                    value={colors[field.id]}
                    onChange={(event) => setColor(field.id, event.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    aria-label={`${field.label} hex code`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
    </>
  );
}
