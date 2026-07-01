"use client";

import { useEffect, useState } from "react";
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
  const [brand, setBrand] = useState<BrandSnapshot>({ name: "Run Mini", mark: "↗", imageSrc: "" });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setBrand(readCurrentBrand());
  }, [mounted, show]);

  useEffect(() => {
    if (!show || !mounted) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-page-loading");
    document.body.setAttribute("aria-busy", "true");

    const blockEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };
    const options: AddEventListenerOptions = { capture: true, passive: false };
    window.addEventListener("click", blockEvent, options);
    window.addEventListener("pointerdown", blockEvent, options);
    window.addEventListener("touchmove", blockEvent, options);
    window.addEventListener("wheel", blockEvent, options);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.classList.remove("is-page-loading");
      document.body.removeAttribute("aria-busy");
      window.removeEventListener("click", blockEvent, options);
      window.removeEventListener("pointerdown", blockEvent, options);
      window.removeEventListener("touchmove", blockEvent, options);
      window.removeEventListener("wheel", blockEvent, options);
    };
  }, [show, mounted]);

  if (!show || !mounted) return null;

  return createPortal(
    <div className="page-loading-overlay mini-transition-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="mini-transition-card">
        <div className="mini-transition-logo" aria-hidden="true">
          {brand.imageSrc ? <img src={brand.imageSrc} alt="" /> : <span>{brand.mark}</span>}
        </div>
        <div className="mini-transition-copy">
          <strong>{label}</strong>
          <small>{brand.name}</small>
        </div>
        <div className="mini-transition-dots" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>,
    document.body,
  );
}
