"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PageLoadingOverlay({
  show,
  label = "Preparing your run...",
}: {
  show?: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show || !mounted) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPointerEvents = document.body.style.pointerEvents;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";
    document.body.classList.add("is-page-loading");
    document.documentElement.classList.add("is-page-loading");
    document.body.setAttribute("aria-busy", "true");

    window.setTimeout(() => overlayRef.current?.focus(), 0);

    const blockEvent = (event: Event) => {
      if (overlayRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    const blockKeyboard = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    const options: AddEventListenerOptions = { capture: true, passive: false };

    window.addEventListener("wheel", blockEvent, options);
    window.addEventListener("touchmove", blockEvent, options);
    window.addEventListener("pointerdown", blockEvent, options);
    window.addEventListener("pointerup", blockEvent, options);
    window.addEventListener("mousedown", blockEvent, options);
    window.addEventListener("mouseup", blockEvent, options);
    window.addEventListener("click", blockEvent, options);
    window.addEventListener("keydown", blockKeyboard, { capture: true });

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.pointerEvents = previousBodyPointerEvents;
      document.body.classList.remove("is-page-loading");
      document.documentElement.classList.remove("is-page-loading");
      document.body.removeAttribute("aria-busy");

      window.removeEventListener("wheel", blockEvent, options);
      window.removeEventListener("touchmove", blockEvent, options);
      window.removeEventListener("pointerdown", blockEvent, options);
      window.removeEventListener("pointerup", blockEvent, options);
      window.removeEventListener("mousedown", blockEvent, options);
      window.removeEventListener("mouseup", blockEvent, options);
      window.removeEventListener("click", blockEvent, options);
      window.removeEventListener("keydown", blockKeyboard, { capture: true });
    };
  }, [show, mounted]);

  if (!show || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="page-loading-overlay route-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-ambient" aria-hidden="true">
        <span className="route-orb route-orb-one" />
        <span className="route-orb route-orb-two" />
        <span className="route-orb route-orb-three" />
        <span className="route-grid" />
      </div>

      <section className="route-loading-card" aria-label={label}>
        <div className="route-loading-topline">
          <span className="route-loading-brand">RUN MINI</span>
          <span className="route-loading-live">
            <i /> Processing
          </span>
        </div>

        <div className="route-map-panel" aria-hidden="true">
          <svg className="route-map-svg" viewBox="0 0 360 210" fill="none">
            <path
              className="route-map-shadow"
              d="M28 158 C76 52, 130 154, 178 86 S271 42, 328 122"
            />
            <path
              className="route-map-base"
              d="M28 158 C76 52, 130 154, 178 86 S271 42, 328 122"
            />
            <path
              className="route-map-active"
              d="M28 158 C76 52, 130 154, 178 86 S271 42, 328 122"
            />
            <circle className="route-check route-check-one" cx="28" cy="158" r="8" />
            <circle className="route-check route-check-two" cx="178" cy="86" r="8" />
            <circle className="route-check route-check-three" cx="328" cy="122" r="8" />
          </svg>

          <div className="route-runner-chip">
            <span className="route-runner-emoji">🏃</span>
          </div>

          <div className="route-map-stat route-map-stat-left">
            <strong>PACE</strong>
            <span>Locked</span>
          </div>
          <div className="route-map-stat route-map-stat-right">
            <strong>SYNC</strong>
            <span>Live</span>
          </div>
        </div>

        <div className="route-loading-copy">
          <span className="route-loading-kicker">Please wait</span>
          <h2>{label}</h2>
          <p>The screen is locked while we save your action and move you to the next step.</p>
        </div>

        <div className="route-loading-progress" aria-hidden="true">
          <span />
        </div>

        <div className="route-loading-steps" aria-hidden="true">
          <span className="is-active">Secure</span>
          <span>Update</span>
          <span>Ready</span>
        </div>
      </section>
    </div>,
    document.body,
  );
}
