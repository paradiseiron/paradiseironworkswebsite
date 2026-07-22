"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OPEN_NOTIFICATION_SETTINGS_EVENT } from "@/components/AdminPushNotifications";

export default function AdminProfileMenu({
  email,
  theme,
  onToggleTheme,
  mobile = false,
}: {
  email?: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  mobile?: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function signOut() {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      ref={menuRef}
      className={mobile ? "relative" : "absolute bottom-4 left-4"}
    >
      {open && (
        <div
          className={`admin-profile-popover w-64 rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-2xl ${
            mobile
              ? "fixed bottom-20 right-3"
              : "absolute bottom-0 left-16"
          }`}
        >
          <div className="border-b border-white/10 px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm text-neutral-200">
              {email || "Admin user"}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/10"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="flex-1">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 rounded-full transition ${
                theme === "light" ? "bg-[#fb5411]" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  theme === "light" ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new Event(OPEN_NOTIFICATION_SETTINGS_EVENT)
              );
              setOpen(false);
            }}
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-white/10"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            Notification settings
          </button>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className={`flex items-center justify-center transition ${
          mobile
            ? "min-w-20 flex-col gap-1 rounded-xl px-3 py-1.5 text-xs"
            : "h-12 w-12 rounded-2xl border"
        } ${
          open
            ? mobile
              ? "text-[#fb5411]"
              : "border-[#fb5411]/40 bg-[#fb5411]/15 text-[#fb5411]"
            : mobile
              ? "text-neutral-400 hover:text-white"
              : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <UserRound className={mobile ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
        {mobile && <span>Account</span>}
      </button>
    </div>
  );
}
