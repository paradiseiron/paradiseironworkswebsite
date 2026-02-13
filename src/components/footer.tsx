// src/components/Footer.tsx
// ✅ Server Component

import Link from "next/link";
import Image from "next/image";

const SITE = {
  name: "Paradise Ironworks & Construction",
  phoneDisplay: "(202) 309-6610",
  phoneE164: "+12023096610",
  email: "info@paradiseironworks.com",
  serviceRegion: "Washington DC, Maryland & Northern Virginia",
};

const SOCIAL = [
  {
    name: "Google",
    href: "https://g.page/your-google-profile-link",
    source: "/images/social/social.png",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/paradise-ironworks-construction",
    source: "/images/social/linkedin.png",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/paradiseironworks",
    source: "/images/social/instagram.png",
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@paradiseironworks",
    source: "/images/social/tiktok.png",
  },
  {
    name: "Houzz",
    href: "https://houzz.com/professionals/fencing-and-gate-sales-and-construction/paradise-ironworks-and-construction-pfvwus-pf~1831183409",
    source: "/images/social/houzz.png",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#09090b] px-8 py-10">
      <div className="mx-auto max-w-[1100px]">

        {/* 🔥 3 Column Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

          {/* Column 1 — Explore + Social */}
          <nav aria-label="Footer Navigation" className="flex flex-col gap-8">
            <div>
              <h2 className="text-[18px] font-medium text-white mb-4">
                Explore
              </h2>

              <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                <Link href="/ironwork-projects" className="text-[#9f9fa9] hover:text-white">
                  Work / Portfolio
                </Link>
                <Link href="/about" className="text-[#9f9fa9] hover:text-white">
                  About
                </Link>
                <Link href="/reviews" className="text-[#9f9fa9] hover:text-white">
                  Reviews
                </Link>
                <Link href="/contact#faq" className="text-[#9f9fa9] hover:text-white">
                  FAQ
                </Link>
                <Link href="/contact" className="text-[#9f9fa9] hover:text-white">
                  Contact
                </Link>
                
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">
                Connect With Us
              </h3>

              <div className="flex flex-wrap items-center gap-6">
                {SOCIAL.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.name}
                    className="relative h-6 w-6 hover:opacity-80 transition"
                  >
                    <Image
                      src={platform.source}
                      alt={`${platform.name} logo`}
                      fill
                      sizes="24px"
                      className="object-contain invert"
                    />
                  </a>
                ))}
              </div>
            </div>
          </nav>

          {/* Column 2 — Service Areas (NOT LINKS) */}
          <div>
            <h2 className="text-[18px] font-medium text-white mb-4">
              Service Areas
            </h2>

            <ul className="grid grid-cols-1 gap-y-2 text-sm text-[#6b7280] leading-relaxed">
              <li>Washington, DC</li>
              <li>Arlington, VA</li>
              <li>Alexandria, VA</li>
              <li>Fairfax, VA</li>
              <li>Bethesda, MD</li>
              <li>Silver Spring, MD</li>
              <li>Rockville, MD</li>
              <li>Chevy Chase, MD</li>
              <li>Prince George's County, MD</li>
              <li>Montgomery County, MD</li>
            </ul>
          </div>

          {/* Column 3 — Company Info */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-md">
                <Image
                  src="/images/paradise_ironworks_logo.png"
                  alt="Paradise Ironworks & Construction logo — custom metal fabrication in Washington DC, Maryland and Northern Virginia"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="text-white text-lg font-medium">
                Paradise Ironworks
              </span>
            </Link>

            <p className="text-[#9f9fa9] text-sm">
              Custom metal railings, gates, stairs, and structural steel fabrication & installation in {SITE.serviceRegion}.
            </p>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`tel:${SITE.phoneE164}`}
                className="text-[#9f9fa9] hover:text-white"
              >
                {SITE.phoneDisplay}
              </a>

              <a
                href={`mailto:${SITE.email}`}
                className="text-[#9f9fa9] hover:text-white"
              >
                {SITE.email}
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#27272a] mt-10 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-[#9f9fa9]">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
