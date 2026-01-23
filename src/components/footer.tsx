"use client";

import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#09090b] px-8 py-5">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Services */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-white">
              Services
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Gates &amp; Fencing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Stairs &amp; Railings
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Balconies
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Commercial Projects
                </a>
              </li>
            </ul>
          </div>

          {/* Service Area - Column 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[18px] font-medium leading-[28px] tracking-[-0.4395px] text-white">
              Service Area
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Washington D.C
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Alexandria, VA
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Fairfax, VA
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Arlington, VA
                </a>
              </li>
            </ul>
          </div>

          {/* Service Area - Column 2 (no heading) */}
          <div className="flex flex-col gap-4">
            <div className="h-[28px]" />
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Prince Georges County
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Montgomery County
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Howard County
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  Baltimore County
                </a>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-5">
              <div className="relative size-10 overflow-hidden rounded-[4px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
                <img
                  src="images/paradise_ironworks_logo.png"
                  alt="Paradise Ironworks Logo"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <p className="text-[20px] leading-[28px] tracking-[-0.4492px] text-white">
                Paradise Ironworks
              </p>
            </div>

            <div className="flex flex-col gap-3 px-5">
              <div className="flex items-start gap-2">
                <Phone className="mt-1 size-4 shrink-0 text-[#FB5411]" />
                <a
                  href="tel:+15551234567"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  (555) 123-4567
                </a>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="mt-1 size-4 shrink-0 text-[#FB5411]" />
                <a
                  href="mailto:info@customironworks.com"
                  className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9] transition-colors hover:text-white"
                >
                  info@customironworks.com
                </a>
              </div>
            </div>

            <div className="px-5">
              <p className="text-[16px] leading-[24px] tracking-[-0.3125px] text-[#9f9fa9]">
                Premium custom ironwork fabrication and installation since 1998
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-3 border-t border-[#27272a] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] leading-[20px] tracking-[-0.1504px] text-[#9f9fa9]">
            © 2026 Paradise Ironworks. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a
              href="#"
              className="text-[14px] leading-[20px] tracking-[-0.1504px] text-[#9f9fa9] transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[14px] leading-[20px] tracking-[-0.1504px] text-[#9f9fa9] transition-colors hover:text-white"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
