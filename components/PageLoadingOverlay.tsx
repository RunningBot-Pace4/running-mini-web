"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PageLoadingOverlay({
  show,
  label = "Loading...",
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
      className="page-loading-overlay premium-route-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <section className="premium-loader-card" aria-label={label}>
        <div className="premium-loader-map" aria-hidden="true">
          <span className="loader-map-glow" />
          <span className="loader-route route-a" />
          <span className="loader-route route-b" />
          <span className="loader-checkpoint checkpoint-a" />
          <span className="loader-checkpoint checkpoint-b" />
          <span className="loader-checkpoint checkpoint-c" />
          <span className="loader-runner">🏃</span>
        </div>

        <div className="premium-loader-copy">
          <span className="loader-status-pill">Processing</span>
          <h2>{label}</h2>
          <p>Locking the page while your running board updates.</p>
        </div>

        <div className="premium-loader-progress" aria-hidden="true">
          <span />
        </div>

        <div className="premium-loader-steps" aria-hidden="true">
          <span>Save</span>
          <span>Sync</span>
          <span>Ready</span>
        </div>
      </section>
    </div>,
    document.body
  );
}
