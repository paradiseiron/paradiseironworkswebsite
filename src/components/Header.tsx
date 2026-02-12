"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement | null>(null);

  // Small delay prevents the menu from closing while moving from button -> panel
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openServices = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setServicesOpen(true);
  };
  const closeServices = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setServicesOpen(false), 120);
  };

  // Close on outside click / Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!servicesRef.current) return;
      if (!servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="fixed left-0 right-0 top-3 sm:top-5 z-50">
      {/* ✅ Option A: large screens use a % width, while keeping your padding behavior */}
      <div className="mx-auto w-full max-w-[1100px] lg:max-w-none lg:w-[92vw] px-4 sm:px-6 md:px-8">
        <div className="relative py-2 my-2 sm:my-3">
          {/* Glass background */}
          <div className="absolute inset-0 -mx-3 sm:-mx-5 -my-2 bg-black/40 backdrop-blur-md rounded-[10px]" />

          {/* Header row */}
          <div className="relative flex items-center justify-between px-3 sm:px-5">
            {/* Logo + Brand (always returns home) */}
            <Link href="/" className="flex min-w-0 items-center gap-3">
              {/* OUTER wrapper (no overflow) so shadow isn't clipped */}
              <div className="relative">
                {/* Shadow layer (NOT clipped) */}
                <div
                  className="absolute inset-0 rounded-[6px] pointer-events-none"
                  style={{
                    filter:
                      "drop-shadow(0px 10px 22px rgba(0,0,0,0.80)) drop-shadow(0px 3px 10px rgba(0,0,0,0.70))",
                  }}
                  aria-hidden="true"
                />

                {/* INNER container clips only the image */}
                <div className="relative size-[60px] rounded-[6px] overflow-hidden">
                  <Image
                    alt="Paradise Ironworks Logo"
                    src="/images/paradise_ironworks_logo.png"
                    fill
                    sizes="60px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <span className="min-w-0 truncate font-['var(--font-montserrat)',sans-serif] text-white tracking-[-0.4492px] text-[16px] sm:text-[18px] md:text-[20px] leading-[24px] sm:leading-[26px] md:leading-[28px]">
                Paradise Ironworks
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {/* Services dropdown (hover) */}
              <div
                ref={servicesRef}
                className="relative"
                onMouseEnter={openServices}
                onMouseLeave={closeServices}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-white text-[16px] leading-[24px] tracking-[-0.3125px] hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md"
                  aria-haspopup="menu"
                  aria-expanded={servicesOpen}
                  onFocus={openServices}
                  onBlur={closeServices}
                >
                  Services
                  <ChevronDown
                    className={`size-4 text-white/80 transition-transform duration-200 ${
                      servicesOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 mt-3 w-64 overflow-hidden rounded-[12px] border border-white/15 bg-black/60 backdrop-blur-md shadow-lg
                  transition-all duration-200 ease-out origin-top
                  ${
                    servicesOpen
                      ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                      : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
                  }`}
                  role="menu"
                  onMouseEnter={openServices}
                  onMouseLeave={closeServices}
                >
                  <Link
                    role="menuitem"
                    href="/services/residential"
                    className="block px-4 py-3 text-white/95 hover:text-white hover:bg-white/12 focus:bg-white/12 focus:text-white transition-colors outline-none"
                    onClick={() => setServicesOpen(false)}
                  >
                    Residential
                  </Link>
                  <Link
                    role="menuitem"
                    href="/services/commercial"
                    className="block px-4 py-3 text-white/95 hover:text-white hover:bg-white/12 focus:bg-white/12 focus:text-white transition-colors outline-none"
                    onClick={() => setServicesOpen(false)}
                  >
                    Commercial
                  </Link>
                  <Link
                    role="menuitem"
                    href="/services/structural"
                    className="block px-4 py-3 text-white/95 hover:text-white hover:bg-white/12 focus:bg-white/12 focus:text-white transition-colors outline-none"
                    onClick={() => setServicesOpen(false)}
                  >
                    Structural
                  </Link>
                </div>
              </div>

              {/* anchors */}
              <a
                href="/contact"
                className="text-white text-[16px] leading-[24px] tracking-[-0.3125px] hover:opacity-80 transition-opacity"
              >
                Contact
              </a>

              <a
                href="/about"
                className="text-white text-[16px] leading-[24px] tracking-[-0.3125px] hover:opacity-80 transition-opacity"
              >
                About
              </a>

              {/* CTA with solid gleam */}
              <Link
                href="/quote"
                className="
                  cta-gleam
                  relative overflow-hidden
                  inline-flex items-center justify-center
                  bg-[#fb5411] px-5 lg:px-6 py-3 rounded-[10px]
                  text-white text-[16px] leading-[24px] tracking-[-0.3125px] font-medium
                  hover:bg-[#e64d0f] transition-colors whitespace-nowrap
                "
              >
                {/* Solid gleam bar; clipped by overflow-hidden on the button */}
                <span
                  aria-hidden="true"
                  className="
                    cta-gleam__shine
                    pointer-events-none absolute inset-y-[-40%]
                    -left-[45%] w-[28%]
                    -skew-x-20
                  "
                />
                <span className="relative z-10">Get a Free Quote</span>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-[10px] border border-white/20 bg-white/10 px-3 py-2 text-white hover:bg-white/15 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="text-sm font-medium">{mobileOpen ? "Close" : "Menu"}</span>
            </button>
          </div>

          {/* Mobile dropdown panel */}
          <div className={`md:hidden relative z-10 px-3 sm:px-5 pt-2 ${mobileOpen ? "block" : "hidden"}`}>
            <div className="rounded-[10px] border border-white/15 bg-black/40 backdrop-blur-md p-3">
              <div className="flex flex-col gap-2">
                <details className="group rounded-lg">
                  <summary className="list-none cursor-pointer rounded-lg px-3 py-2 text-white hover:bg-white/10 transition-colors flex items-center justify-between">
                    <span>Services</span>
                    <ChevronDown className="size-4 text-white/80 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="mt-1 flex flex-col">
                    <Link
                      href="/services/residential"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2 pl-6 text-white/95 hover:bg-white/10 transition-colors"
                    >
                      Residential
                    </Link>
                    <Link
                      href="/services/commercial"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2 pl-6 text-white/95 hover:bg-white/10 transition-colors"
                    >
                      Commercial
                    </Link>
                    <Link
                      href="/services/structural"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2 pl-6 text-white/95 hover:bg-white/10 transition-colors"
                    >
                      Structural
                    </Link>
                  </div>
                </details>

                <a
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-white hover:bg-white/10 transition-colors"
                >
                  Contact
                </a>

                <a
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-white hover:bg-white/10 transition-colors"
                >
                  About
                </a>

                <Link
                  href="/quote"
                  onClick={() => setMobileOpen(false)}
                  className="
                    cta-gleam
                    relative overflow-hidden
                    mt-1 w-full text-center
                    bg-[#fb5411] px-4 py-3 rounded-[10px]
                    text-white font-medium hover:bg-[#e64d0f] transition-colors
                  "
                >
                  <span
                    aria-hidden="true"
                    className="
                      cta-gleam__shine
                      pointer-events-none absolute inset-y-[-40%]
                      -left-[45%] w-[28%]
                      -skew-x-20
                    "
                  />
                  <span className="relative z-10">Get a Free Quote</span>
                </Link>
              </div>
            </div>
          </div>
          {/* /Mobile dropdown panel */}
        </div>
      </div>
    </header>
  );
}
