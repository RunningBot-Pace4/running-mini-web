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
      className="page-loading-overlay pace-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pace-loading-sky" aria-hidden="true">
        <span className="pace-loading-sun" />
        <span className="pace-loading-cloud cloud-one" />
        <span className="pace-loading-cloud cloud-two" />
        <span className="pace-loading-sweat sweat-one" />
        <span className="pace-loading-sweat sweat-two" />
        <span className="pace-loading-sweat sweat-three" />
        <span className="pace-loading-wave wave-one" />
        <span className="pace-loading-wave wave-two" />
      </div>

      <section className="pace-loading-card" aria-label={label}>
        <div className="pace-loading-topline">
          <span className="pace-live-dot" />
          Run Mini is working
        </div>

        <div className="pace-loading-route" aria-hidden="true">
          <svg viewBox="0 0 320 150" role="img">
            <path
              className="pace-route-shadow"
              d="M18 116 C58 42 100 44 130 94 S206 142 236 76 S292 40 306 82"
              fill="none"
            />
            <path
              className="pace-route-line"
              d="M18 116 C58 42 100 44 130 94 S206 142 236 76 S292 40 306 82"
              fill="none"
            />
          </svg>
          <span className="pace-runner-dot">
            <span>🏃</span>
          </span>
          <span className="pace-finish-flag">🏁</span>
        </div>

        <div className="pace-loading-copy">
          <span className="pace-kicker">Sky · Sea · Sweat</span>
          <h2>{label}</h2>
          <p>Please hold on. We are locking the screen, saving your action, and moving you to the next step.</p>
        </div>

        <div className="pace-loading-progress" aria-hidden="true">
          <span />
        </div>

        <div className="pace-loading-steps" aria-hidden="true">
          <span>Secure</span>
          <span>Save</span>
          <span>Refresh</span>
        </div>
      </section>
    </div>,
    document.body,
  );
}
