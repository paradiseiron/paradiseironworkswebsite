"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";


/**
 * Same image handling format as ServicesSection:
 * - Works with "/public" string paths
 * - Works with imported StaticImageData
 */
type NextImageLike = StaticImageData | string;

function asNextImageSrc(src: unknown): NextImageLike {
  if (typeof src === "string") return src;
  if (src && typeof src === "object" && "src" in (src as any)) return src as StaticImageData;
  return "";
}

interface WorkCardProps {
  image: unknown;
  category: string;
  title: string;
  slug: string;
}

function WorkCard({ image, category, title, slug }: WorkCardProps) {
  const imgSrc = asNextImageSrc(image);

  return (
    <Link
      href={`/ironwork-projects/${slug}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-[10px]"
      aria-label={`${category}: ${title}`}
    >
      <article
        className="
          relative overflow-hidden rounded-[10px] group
          w-full aspect-square
          bg-black/5
        "
      >
        {/* Image */}
        <div className="absolute inset-0">
          <Image
            alt={`${category} project: ${title}`}
            src={imgSrc}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/80 via-black/40 to-transparent
            opacity-100 sm:opacity-0 sm:group-hover:opacity-100
            transition-opacity duration-300
          "
        >
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 space-y-1">
            <p className="text-[#ffb900] text-[12px] sm:text-[14px]">
              {category}
            </p>
            <h3 className="text-white text-[18px] sm:text-[20px] font-medium">
              {title}
            </h3>
          </div>
        </div>
      </article>
    </Link>
  );
}


export default function WorkSection() {
  const IMGgate = "/images/double-swing-security-gate-steel-mesh-dc.jpeg";
  const IMGcable = "/images/stainless-cable-railing-exterior-commercial-dc.jpeg";
  const IMGstruc = "/images/structural-steel-erection-commercial-building-dc.jpeg";
  const IMGcan = "/images/commercial-steel-canopy-frame-fabrication-installation.jpg";
  const IMGext = "/images/residential-exterior-stairs-metal-railings-md.jpeg";
  const IMGint = "/images/modern-interior-stair-railing-horizontal-metal-black.jpg";

  return (
    <section className="bg-[#fafafa] py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-[#0a0a0a] text-[32px] leading-[36px] sm:text-[40px] sm:leading-[44px] lg:text-[48px] lg:leading-[48px] tracking-[0.3516px] font-medium mb-3 sm:mb-4">
            Our Work
          </h2>
          <p className="text-[#52525c] text-[16px] leading-[24px] sm:text-[18px] sm:leading-[26px] lg:text-[20px] lg:leading-[28px] tracking-[-0.4492px] max-w-[672px] mx-auto">
            Explore our portfolio of completed projects showcasing our craftsmanship and attention to detail
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <WorkCard image={IMGgate} category="Commercial" title="Custom Entry Gate" slug="commercial-security-gate-steel-mesh-reston-virginia" />
          <WorkCard image={IMGcable} category="Commercial" title="Cable Fencing" slug="commercial-stainless-cable-railing-exterior-dc" />
          <WorkCard image={IMGstruc} category="Structural" title="Structural Steel Installation" slug="structural-steel-framing-training-facility-beltsville-maryland" />
          <WorkCard image={IMGext} category="Residential" title="Exterior Railing" slug="residential-exterior-stairs-metal-railings-md" />
          <WorkCard image={IMGcan} category="Commercial" title="Steel Canopy Frame Installation" slug="commercial-steel-canopy-frame-glen-burnie-maryland" />
          <WorkCard image={IMGint} category="Residential" title="Interior Railing" slug="residential-interior-stair-railing-black-metal-md" />
        </div>
      </div>
    </section>
  );
}
