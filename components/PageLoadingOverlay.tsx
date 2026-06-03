"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PageLoadingOverlay({
  show,
  label = "Loading...",
}: {
  show?: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!show || !mounted) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("is-page-loading");
    document.documentElement.classList.add("is-page-loading");
    document.body.setAttribute("aria-busy", "true");

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    const blockKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab") return;
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
    <div className="page-loading-overlay cn-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="cn-loading-ambient" aria-hidden="true">
        <span className="cn-ambient-dot dot-1" />
        <span className="cn-ambient-dot dot-2" />
        <span className="cn-ambient-dot dot-3" />
      </div>

      <div className="cn-loading-phone">
        <div className="cn-loading-top">
          <span className="phone-avatar">跑</span>
          <div>
            <span className="loading-kicker">RUN MINI</span>
            <strong>{label}</strong>
          </div>
          <span className="cn-loading-live">加油</span>
        </div>

        <div className="cn-loading-track" aria-hidden="true">
          <span className="cn-track-line line-a" />
          <span className="cn-track-line line-b" />
          <span className="cn-track-line line-c" />
          <span className="cn-track-runner">🏃‍♂️</span>
        </div>

        <div className="cn-loading-copy">
          <span>Updating your challenge board</span>
          <small>Please wait. The lane is locked so nothing is clicked twice.</small>
        </div>

        <div className="cn-progress-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>,
    document.body,
  );
}
