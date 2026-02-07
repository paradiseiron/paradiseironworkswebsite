"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

const CHECK_PATH = "M5 10.5L8.5 14L15 6.5";

type NextImageLike = StaticImageData | string;

function asNextImageSrc(src: unknown): NextImageLike {
  if (typeof src === "string") return src;
  if (src && typeof src === "object" && "src" in (src as any)) return src as StaticImageData;
  return "";
}

interface ServiceCardProps {
  image: unknown; // string "/public" path or StaticImageData
  title: string;
  items: string[];
  href: string;
  imageAlt: string;
  imageClass?: string;
  priority?: boolean;
}

function ServiceCard({
  image,
  title,
  items,
  href,
  imageAlt,
  imageClass = "",
  priority = false,
}: ServiceCardProps) {
  const imgSrc = asNextImageSrc(image);

  return (
    <article
      className="
        flex flex-col overflow-hidden rounded-2xl border border-white/10
        bg-white/5 backdrop-blur-md shadow-lg
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-xl hover:border-white/20
        focus-within:ring-2 focus-within:ring-white/25
      "
      aria-label={`${title} services`}
    >
      {/* Image */}
      <div className="relative h-[220px] overflow-hidden">
        <Image
          alt={imageAlt}
          src={imgSrc}
          fill
          sizes="(min-width: 1024px) 340px, (min-width: 768px) 33vw, 100vw"
          className={`object-cover ${imageClass}`}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-4">
        <h3 className="m-0">
          <Link
            href={href}
            className="
              block w-full text-center
              bg-white/10 border border-white/15
              px-5 py-3 rounded-xl
              text-white text-[16px] leading-[24px] tracking-[-0.3125px] font-medium
              transition-colors
              hover:bg-white/15
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            "
            aria-label={`Learn more about ${title} ironwork services`}
          >
            {title}
          </Link>
        </h3>

        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg className="mt-[2px] size-5 shrink-0" fill="none" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d={CHECK_PATH}
                  stroke="rgba(255,255,255,0.85)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.66667"
                />
              </svg>

              <span className="text-white/85 text-[16px] leading-[24px] tracking-[-0.3125px]">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="bg-[#0a0a0a] py-16 sm:py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="services-heading">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2
            id="services-heading"
            className="text-white text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[48px] lg:leading-[48px] tracking-[0.3516px] font-medium mb-4"
          >
            Explore our Services
          </h2>
          <p className="text-white/70 text-[18px] leading-[26px] sm:text-[20px] sm:leading-[28px] tracking-[-0.4492px] max-w-[672px] mx-auto">
            From residential elegance to commercial strength, we deliver exceptional ironwork solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <ServiceCard
            image="/images/residential-metal-rail1.jpg"
            title="Residential"
            href="/services/residential"
            imageAlt="Custom residential metal railing and stair installation in the Washington DC area"
            items={["Interior stair railings",
                    "Exterior porch railings",
                    "Juliet balconies",
                    "Driveway & walk gates",
                    "Fence panels & sections",
                    "Handrails for steps",
                    "Deck & balcony guards",
                    "Window guards (security)",
                    "Custom metal stair systems",
                    "Wrought iron decorative details"]}
            priority={false}
          />
          <ServiceCard
            image="/images/commercial.jpg"
            title="Commercial"
            href="/services/commercial"
            imageAlt="Commercial metal fabrication including railings, stairs, and security gates for DMV properties"
            items={["Code-compliant railings", "Commercial stair handrails",
  "Security gates & access control",
  "Metal fencing & barriers",
  "Dumpster enclosures",
  "Loading dock protection",
  "Bollards & guard rails",
  "Canopies & awning frames",
  "ADA handrails (as required)",
  "On-site repair & upgrades"]}
          />
          <ServiceCard
            image="/images/structural-steel-install.jpg"
            title="Structural"
            href="/services/structural"
            imageAlt="Structural steel installation and support framing for commercial construction projects"
            items={["Structural steel framing",
  "Beams & columns",
  "Steel supports & bracing",
  "Canopy frame fabrication",
  "Steel stair stringers",
  "Platforms & equipment supports",
  "Lintels & opening supports",
  "Welded connection assemblies",
  "Field installation & erection"]}
          />
        </div>
      </div>
    </section>
  );
}
