"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isiOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // The app still works if service worker registration fails.
        });
      });
    }

    const dismissedAt = Number(window.localStorage.getItem("run-mini-install-dismissed-at") || "0");
    const dismissedRecently = dismissedAt && Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!dismissedRecently && !isStandalone()) setVisible(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (isiOS() && !dismissedRecently && !isStandalone()) {
      const timer = window.setTimeout(() => setVisible(true), 1400);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || !visible) return null;

  async function installApp() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
      return;
    }

    setShowSteps(true);
  }

  function close() {
    window.localStorage.setItem("run-mini-install-dismissed-at", String(Date.now()));
    setVisible(false);
  }

  return (
    <aside className="pwa-install-card" aria-label="Install Run Mini shortcut">
      <button className="pwa-close" type="button" onClick={close} aria-label="Close install prompt">
        ×
      </button>

      <div className="pwa-icon-wrap">
        <img src="/icon-192.png" alt="" width={42} height={42} />
      </div>

      <div className="pwa-copy">
        <strong>Add Run Mini to Home Screen</strong>
        <span>Open faster like an app for voting, KM submission and points.</span>

        {showSteps && (
          <div className="pwa-steps">
            {isiOS() ? (
              <>
                <span>iPhone Safari: tap Share.</span>
                <span>Choose “Add to Home Screen”.</span>
              </>
            ) : (
              <>
                <span>Tap browser menu ⋮.</span>
                <span>Choose “Install app” or “Add to Home screen”.</span>
              </>
            )}
          </div>
        )}
      </div>

      <button className="button pwa-install-button" type="button" onClick={installApp}>
        Add
      </button>
    </aside>
  );
}
