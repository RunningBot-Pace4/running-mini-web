"use client";

import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { useActionState, useState } from "react";
import type { ChangeEvent } from "react";
import { RichDescriptionEditor } from "@/components/RichDescriptionEditor";

type State = { error?: string; success?: string } | undefined;

type HomeContent = {
  brandName: string;
  brandMark: string;
  logoImageDataUrl?: string | null;
  themePrimary: string;
  themeSecondary: string;
  themeBackground: string;
  themeDark: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

const colorFields = [
  { id: "themePrimary", label: "Sea primary" },
  { id: "themeSecondary", label: "Sunrise accent" },
  { id: "themeBackground", label: "Sky background" },
  { id: "themeDark", label: "Deep navy" },
] as const;

export function HomeContentForm({
  content,
  action,
}: {
  content: HomeContent;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [logoImageDataUrl, setLogoImageDataUrl] = useState(content.logoImageDataUrl || "");
  const [logoError, setLogoError] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [colors, setColors] = useState({
    themePrimary: content.themePrimary,
    themeSecondary: content.themeSecondary,
    themeBackground: content.themeBackground,
    themeDark: content.themeDark,
  });

  function setColor(id: keyof typeof colors, value: string) {
    setColors((current) => ({ ...current, [id]: value }));
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    setLogoError("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 500 * 1024) {
      setLogoError("Logo image should be below 500KB for fast mobile loading.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoImageDataUrl(String(reader.result || ""));
      setRemoveLogo(false);
    };
    reader.onerror = () => setLogoError("Could not read the logo file. Please try another image.");
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageLoadingOverlay show={pending} label="Saving home content..." />
      <form className="form-stack" action={formAction}>
        <div className="theme-editor-card coastal-admin-card">
          <div>
            <span className="eyebrow">Brand logo & coastal theme</span>
            <h3>Make the club feel premium</h3>
            <p className="muted">
              Upload a logo image, keep a text fallback, and tune the sky/sea/sunrise colors used across the web.
            </p>
          </div>

          <div className="logo-upload-panel">
            <div className="logo-preview-card">
              {logoImageDataUrl && !removeLogo ? (
                <img src={logoImageDataUrl} alt="Current logo preview" />
              ) : (
                <span>{content.brandMark || "↗"}</span>
              )}
            </div>

            <div className="logo-upload-controls">
              <label htmlFor="logoImage">Logo image</label>
              <input
                id="logoImage"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
              />
              <input type="hidden" name="logoImageDataUrl" value={removeLogo ? "" : logoImageDataUrl} />
              <p className="muted editor-help">Recommended: transparent PNG/WebP, square, below 500KB.</p>
              {logoError && <p className="error">{logoError}</p>}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="removeLogoImage"
                  checked={removeLogo}
                  onChange={(event) => setRemoveLogo(event.target.checked)}
                />
                Remove uploaded image and use text logo
              </label>
            </div>
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
              <label htmlFor="brandMark">Logo mark / fallback icon</label>
              <input
                id="brandMark"
                name="brandMark"
                required
                maxLength={4}
                defaultValue={content.brandMark}
              />
              <p className="muted editor-help">Used if no image logo is uploaded.</p>
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
