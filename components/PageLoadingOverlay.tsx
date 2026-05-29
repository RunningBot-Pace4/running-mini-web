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
    <div className="page-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading-track" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="page-loading-card">
        <span className="page-loading-runner" aria-hidden="true">🏃‍♂️</span>
        <span className="page-loading-spinner" aria-hidden="true" />
        <strong>{label}</strong>
        <small>Hold tight. We are updating your running board.</small>
      </div>
    </div>,
    document.body,
  );
}
