"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_PROMPT_ACKNOWLEDGED_KEY =
  "paradise-admin-install-prompt-acknowledged";

function wasInstallPromptAcknowledged() {
  if (typeof window === "undefined") return false;

  return (
    window.localStorage.getItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY) === "true" ||
    window.localStorage.getItem("admin-pwa-ios-dismissed") === "true"
  );
}

export default function AdminPwa() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showIosInstall, setShowIosInstall] = useState(false);
  const [dismissed, setDismissed] = useState(wasInstallPromptAcknowledged);
  const refreshing = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone
      );
    const installPromptAcknowledged = wasInstallPromptAcknowledged();

    if (installPromptAcknowledged) {
      window.localStorage.setItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY, "true");
    }

    const shouldShowIosInstall =
      isIos &&
      !isStandalone &&
      !installPromptAcknowledged;
    const iosPromptTimer = shouldShowIosInstall
      ? window.setTimeout(() => setShowIosInstall(true), 0)
      : undefined;

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (
        window.localStorage.getItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY) === "true"
      ) {
        return;
      }
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleInstalled = () => {
      window.localStorage.setItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY, "true");
      setInstallPrompt(null);
      setShowIosInstall(false);
      setDismissed(true);
    };
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

  const installPromptAcknowledged = wasInstallPromptAcknowledged();
  const hasInstallNotice =
    !installPromptAcknowledged && Boolean(installPrompt || showIosInstall);

  if (dismissed || (!hasInstallNotice && !waitingWorker)) {
    return null;
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    window.localStorage.setItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY, "true");
    setInstallPrompt(null);
    setDismissed(true);
  }

  function update() {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  }

  const isUpdate = Boolean(waitingWorker);
  const isIosInstall =
    !isUpdate &&
    !installPromptAcknowledged &&
    !installPrompt &&
    showIosInstall;

  function dismiss() {
    if (!isUpdate) {
      window.localStorage.setItem(INSTALL_PROMPT_ACKNOWLEDGED_KEY, "true");
      setInstallPrompt(null);
      setShowIosInstall(false);
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
