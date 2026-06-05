"use client";

import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { RichDescriptionEditor } from "@/components/RichDescriptionEditor";
import { getThemePreset, THEME_PRESETS } from "@/lib/theme-presets";

type State = { error?: string; success?: string } | undefined;

type HomeContent = {
  brandName: string;
  brandMark: string;
  logoImageDataUrl?: string | null;
  themePreset?: string | null;
  themePrimary: string;
  themeSecondary: string;
  themeBackground: string;
  themeDark: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

function applyThemePresetToPage(themeKey: string) {
  const theme = getThemePreset(themeKey);
  const themeVars: Record<string, string> = {
    "--accent": theme.primary,
    "--accent-2": theme.secondary,
    "--accent-dark": theme.primary,
    "--bg": theme.background,
    "--bg-2": theme.background,
    "--ink": theme.dark,
    "--text": theme.dark,
    "--cn-red": theme.secondary,
    "--cn-orange": theme.secondary,
    "--cn-gold": theme.secondary,
    "--cn-gold-2": "#ffd166",
    "--cn-ink": theme.dark,
    "--cn-deep": theme.dark,
    "--cn-paper": theme.background,
    "--brand-primary": theme.primary,
    "--brand-secondary": theme.secondary,
    "--brand-background": theme.background,
    "--brand-dark": theme.dark,
    "--sky": theme.primary,
    "--sea": theme.primary,
    "--sunrise": theme.secondary,
    "--mist": "#dde7f0",
    "--sand": theme.background,
  };

  const targets = [document.documentElement, document.body].filter(Boolean);
  for (const target of targets) {
    for (const [name, value] of Object.entries(themeVars)) {
      target.style.setProperty(name, value);
    }
  }

  document.body.dataset.themePreset = theme.key;
}

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
  const [selectedTheme, setSelectedTheme] = useState(getThemePreset(content.themePreset).key);

  const previewTheme = useMemo(() => getThemePreset(selectedTheme), [selectedTheme]);

  useEffect(() => {
    applyThemePresetToPage(selectedTheme);
  }, [selectedTheme]);

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
      <PageLoadingOverlay show={pending} label="Saving theme..." />
      <form className="form-stack" action={formAction}>
        <div className="theme-editor-card coastal-admin-card">
          <div>
            <span className="eyebrow">Brand logo & theme</span>
            <h3>Choose one fixed design theme</h3>
            <p className="muted">
              No more difficult color tuning. Pick one of the 10 ready-made themes below. The web will apply the matching colors automatically.
            </p>
          </div>

          <div className="logo-upload-panel">
            <div
              className="logo-preview-card"
              style={{
                background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.secondary})`,
              }}
            >
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

          <div className="fixed-theme-picker">
            <div className="fixed-theme-picker-head">
              <div>
                <label>Website theme</label>
                <p className="muted editor-help">Tap a theme to preview instantly on this page, then click Save home content to publish it for everyone.</p>
              </div>
              <strong>{previewTheme.name}</strong>
            </div>

            <div className="theme-preset-grid">
              {THEME_PRESETS.map((theme) => (
                <label
                  className={`theme-preset-card ${selectedTheme === theme.key ? "is-selected" : ""}`}
                  key={theme.key}
                  style={{
                    "--preset-primary": theme.primary,
                    "--preset-secondary": theme.secondary,
                    "--preset-bg": theme.background,
                    "--preset-dark": theme.dark,
                  } as CSSProperties}
                >
                  <input
                    type="radio"
                    name="themePreset"
                    value={theme.key}
                    checked={selectedTheme === theme.key}
                    onChange={() => setSelectedTheme(theme.key)}
                  />
                  <span className="theme-preset-swatch" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="theme-preset-copy">
                    <strong>{theme.name}</strong>
                    <small>{theme.tagline}</small>
                    {selectedTheme === theme.key && <em>Selected</em>}
                  </span>
                </label>
              ))}
            </div>
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
