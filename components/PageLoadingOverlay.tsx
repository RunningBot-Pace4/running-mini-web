"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type BrandSnapshot = {
  name: string;
  mark: string;
  imageSrc: string;
};

function readCurrentBrand(): BrandSnapshot {
  const brandElement = document.querySelector<HTMLElement>(".brand");
  const markElement = brandElement?.querySelector<HTMLElement>(".brand-mark");
  const imageElement = markElement?.querySelector<HTMLImageElement>("img");
  const nameElement = brandElement?.querySelector<HTMLElement>(".brand-name");

  return {
    name: nameElement?.textContent?.trim() || "Run Mini",
    mark: markElement?.textContent?.trim() || "↗",
    imageSrc: imageElement?.getAttribute("src") || "",
  };
}

export function PageLoadingOverlay({
  show,
  label = "Loading...",
}: {
  show?: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<BrandSnapshot>({
    name: "Run Mini",
    mark: "↗",
    imageSrc: "",
  });
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setBrand(readCurrentBrand());
  }, [mounted, show]);

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
      className="page-loading-overlay cute-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <section className="cute-loading-card" aria-label={label}>
        <div className="cute-loading-brand">
          <div className="cute-loading-logo" aria-hidden="true">
            {brand.imageSrc ? <img src={brand.imageSrc} alt="" /> : <span>{brand.mark}</span>}
          </div>
          <div>
            <strong>{brand.name}</strong>
            <small>Preparing your member dashboard</small>
          </div>
        </div>

        <div className="cute-loading-stage" aria-hidden="true">
          <span className="cute-loading-cloud left" />
          <span className="cute-loading-cloud right" />
          <div className="cute-loading-sun" />
          <div className="cute-loading-track">
            <i />
            <b />
          </div>
        </div>

        <div className="cute-loading-copy">
          <h2>{label}</h2>
          <p>Please wait while we sync your points, tiers and club activities.</p>
        </div>

        <div className="cute-loading-bar" aria-hidden="true">
          <span />
        </div>
      </section>
    </div>,
    document.body,
  );
}
