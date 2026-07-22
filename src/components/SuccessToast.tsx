"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function SuccessToast({
  message,
  queryParam,
}: {
  message: string;
  queryParam?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 20);
    const hideTimer = window.setTimeout(() => setVisible(false), 3500);
    const removeTimer = window.setTimeout(() => {
      setMounted(false);
      if (!queryParam) return;

      const params = new URLSearchParams(window.location.search);
      params.delete(queryParam);
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    }, 3800);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [queryParam]);

  function removeQueryParam() {
    if (!queryParam) return;

    const params = new URLSearchParams(window.location.search);
    params.delete(queryParam);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`
    );
  }

  function dismiss() {
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
      removeQueryParam();
    }, 300);
  }

  if (!mounted) return null;

  return (
    <div
      role="status"
      className={`fixed left-4 right-4 top-20 z-50 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-neutral-900 p-4 text-emerald-100 shadow-2xl transition-all duration-300 sm:left-auto sm:right-6 sm:top-24 sm:w-[min(420px,calc(100vw-3rem))] ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-3 opacity-0"
      }`}
    >
      <CheckCircle2
        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
        aria-hidden="true"
      />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="cursor-pointer rounded-md p-0.5 text-emerald-200/60 transition hover:bg-white/5 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
