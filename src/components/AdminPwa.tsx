"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function AdminPwa() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showIosInstall, setShowIosInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const refreshing = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone
      );
    const shouldShowIosInstall =
      isIos &&
      !isStandalone &&
      window.localStorage.getItem("admin-pwa-ios-dismissed") !== "true";
    const iosPromptTimer = shouldShowIosInstall
      ? window.setTimeout(() => setShowIosInstall(true), 0)
      : undefined;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleInstalled = () => setInstallPrompt(null);
    const handleControllerChange = () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    navigator.serviceWorker
      .register("/admin-sw.js", { scope: "/admin" })
      .then((registration) => {
        if (registration.waiting) setWaitingWorker(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(worker);
              setDismissed(false);
            }
          });
        });
      })
      .catch((error) => {
        console.error("Admin PWA registration failed:", error);
      });

    return () => {
      if (iosPromptTimer !== undefined) {
        window.clearTimeout(iosPromptTimer);
      }
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  if (
    dismissed ||
    (!installPrompt && !waitingWorker && !showIosInstall)
  ) {
    return null;
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  function update() {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  }

  const isUpdate = Boolean(waitingWorker);
  const isIosInstall = !isUpdate && !installPrompt && showIosInstall;

  function dismiss() {
    if (isIosInstall) {
      window.localStorage.setItem("admin-pwa-ios-dismissed", "true");
    }
    setDismissed(true);
  }

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 z-[60] rounded-2xl border border-white/10 bg-neutral-900 p-4 text-white shadow-2xl md:bottom-6 md:left-auto md:right-6 md:w-[380px]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#fb5411]/15 p-2 text-[#fb5411]">
          {isUpdate ? (
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {isUpdate ? "Admin update ready" : "Install Paradise Admin"}
          </p>
          <p className="mt-1 text-sm leading-5 text-neutral-400">
            {isUpdate
              ? "Refresh to use the latest version."
              : isIosInstall
                ? "In Safari, tap Share, then “Add to Home Screen.”"
              : "Add the admin app to this device for quicker access."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-lg p-1 text-neutral-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {!isIosInstall && (
        <button
          type="button"
          onClick={isUpdate ? update : install}
          className="mt-4 w-full rounded-xl bg-[#fb5411] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e64d0f]"
        >
          {isUpdate ? "Update now" : "Install app"}
        </button>
      )}
    </aside>
  );
}
