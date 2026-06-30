"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminProfileMenu({
  email,
  theme,
  onToggleTheme,
}: {
  email?: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
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
    <div ref={menuRef} className="absolute bottom-4 left-4">
      {open && (
        <div className="admin-profile-popover absolute bottom-0 left-16 w-64 rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-2xl">
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
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
          open
            ? "border-[#fb5411]/40 bg-[#fb5411]/15 text-[#fb5411]"
            : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <UserRound className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}
