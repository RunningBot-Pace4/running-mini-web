"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function PageLoadingOverlay({
  show,
  label = "Warming up your run...",
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
      className="page-loading-overlay coastal-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="coastal-loading-scene" aria-hidden="true">
        <span className="coastal-loading-sun" />
        <span className="coastal-loading-cloud cloud-a" />
        <span className="coastal-loading-cloud cloud-b" />
        <span className="coastal-loading-sweat sweat-a" />
        <span className="coastal-loading-sweat sweat-b" />
        <span className="coastal-loading-sweat sweat-c" />
        <span className="coastal-loading-wave wave-a" />
        <span className="coastal-loading-wave wave-b" />
      </div>

      <section className="coastal-loading-card" aria-label={label}>
        <div className="coastal-loading-badge">
          <span className="pulse-dot" />
          Run Mini
        </div>

        <div className="coastal-loading-track" aria-hidden="true">
          <span className="coastal-loading-runner">🏃‍♂️</span>
          <span className="coastal-loading-path" />
          <span className="coastal-loading-check check-one" />
          <span className="coastal-loading-check check-two" />
          <span className="coastal-loading-check check-three" />
        </div>

        <div className="coastal-loading-copy">
          <span>Sky · Sea · Sweat</span>
          <h2>{label}</h2>
          <p>Locking the screen while we save your action and prepare the next step.</p>
        </div>

        <div className="coastal-loading-progress" aria-hidden="true">
          <span />
        </div>

        <div className="coastal-loading-status" aria-hidden="true">
          <span>Warm up</span>
          <span>Sync</span>
          <span>Ready</span>
        </div>
      </section>
    </div>,
    document.body,
  );
}
