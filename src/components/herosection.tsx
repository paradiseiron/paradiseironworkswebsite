"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";


function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.06a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div className="relative min-h-[80vh] sm:min-h-[85vh] md:min-h-[90vh] lg:min-h-[100svh]">
        {/* Background Image (Parallax) */}
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <Image
            alt="Ironwork background"
            src="/images/welding_metal_railing5-2400.webp"
            priority
            fill
            sizes="100vw"
            className="object-cover object-[50%, 30%] scale-100"
          />
        </motion.div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Content anchored near bottom */}
        <div className="relative z-20 flex min-h-[80vh] sm:min-h-[85vh] md:min-h-[90vh] lg:min-h-[100svh] items-end">
          <div className="w-full mx-auto max-w-[1100px] px-4 sm:px-6 md:px-8 pb-10 sm:pb-14 md:pb-16">
            <div className="max-w-[820px] space-y-4 sm:space-y-5">
              <h1 className="text-white font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                Custom Ironwork That Stands the Test of Time
              </h1>

              <p className="text-white/90 max-w-[720px] text-base sm:text-lg md:text-xl leading-6 sm:leading-7 md:leading-8">
                Expert fabrication and installation of custom iron gates, railings,
                stairs, and architectural metalwork for residential and commercial
                properties across the DMV.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/ironwork-projects"
                  className="inline-flex items-center justify-center rounded-[10px] bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 sm:px-7 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-white/20 transition-colors"
                >
                  View Our Work
                </Link>

                
               <a href="tel:+13014414919" className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#fb5411] px-6 py-3 sm:px-7 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-[#e64d0f] transition-colors" > <PhoneIcon className="size-5" /> Call Now: 301-441-4919 </a>


              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent z-20" />
      </div>
    </section>
  );
}

