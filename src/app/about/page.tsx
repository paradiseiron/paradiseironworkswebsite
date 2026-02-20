// src/app/about/page.tsx
import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

const SITE_URL = "https://paradiseironworks.com"; // ✅ replace
const BUSINESS_NAME = "Paradise Ironworks";
const PHONE = "+13014414919"; // ✅ already used on your site
const AREA_SERVED = [
  "Washington, DC",
  "Maryland",
  "Northern Virginia",
  "Prince George’s County, MD",
  "Montgomery County, MD",
  "Anne Arundel County, MD",
  "Baltimore, MD",
];

export const metadata: Metadata = {
  title: "About Paradise Ironworks | Family-Owned Ironwork in DC, Maryland & Virginia",
  description:
    "Learn about Paradise Ironworks—family-owned metal fabrication and ironwork serving Washington DC, Maryland, and Northern Virginia since 2000. Residential, commercial, and structural steel work.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Paradise Ironworks",
    description:
      "Family-owned ironwork and metal fabrication serving DC, Maryland, and Northern Virginia since 2000.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
};

export default function AboutPage() {
  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness", // good fit: local service business
    "@id": `${SITE_URL}/#localbusiness`,
    name: BUSINESS_NAME,
    url: SITE_URL,
    telephone: PHONE,
    // ✅ Update if you have a public email
    // email: "info@YOUR_SITE_URL.com",
    image: [
      `${SITE_URL}/images/paradise_ironworks_logo.png`,
      // If you have a strong hero photo, add it too:
      // `${SITE_URL}/images/welding_metal_railing.jpg`,
    ],
    logo: `${SITE_URL}/images/paradise_ironworks_logo.png`,
    description:
      "Paradise Ironworks is a family-owned metal fabrication and ironwork company serving Washington, DC, Maryland, and Northern Virginia since 2000. We specialize in residential ironwork, commercial metalwork, and structural steel support.",
    foundingDate: "2000",
    founder: {
      "@type": "Person",
      name: "Ronald Brown",
      jobTitle: "Founder",
      description: "Retired Prince George’s County firefighter.",
    },
    // ✅ Add your primary service categories
    knowsAbout: [
      "Ironwork",
      "Metal fabrication",
      "Residential railings",
      "Commercial railings",
      "Security gates",
      "Fencing",
      "Structural steel",
      "Stairs",
      "Handrails",
    ],
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
    // ✅ Optional: If you have a real physical address, fill it in.
    // If you do NOT want to publish an address, remove address entirely.
    address: {
      "@type": "PostalAddress",
      streetAddress: "YOUR_STREET_ADDRESS",
      addressLocality: "YOUR_CITY",
      addressRegion: "MD",
      postalCode: "YOUR_ZIP",
      addressCountry: "US",
    },
    // ✅ Optional: set this if you have a Google Business Profile link
    // sameAs: ["https://www.google.com/maps?cid=YOUR_CID", "https://www.houzz.com/pro/paradiseironworksco"],
    brand: {
      "@type": "Brand",
      name: BUSINESS_NAME,
    },
    // ✅ Nice-to-have: list your main service pages
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Ironwork & Metal Fabrication Services",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Residential Ironwork",
          url: `${SITE_URL}/services/residential`,
        },
        {
          "@type": "OfferCatalog",
          name: "Commercial Metalwork",
          url: `${SITE_URL}/services/commercial`,
        },
        {
          "@type": "OfferCatalog",
          name: "Structural Steel",
          url: `${SITE_URL}/services/structural`,
        },
      ],
    },
  };

  const jsonLdAboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about/#aboutpage`,
    url: `${SITE_URL}/about`,
    name: `About ${BUSINESS_NAME}`,
    description:
      "Learn about Paradise Ironworks—family-owned ironwork and metal fabrication serving the DMV region since 2000.",
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BUSINESS_NAME,
    },
    about: {
      "@id": `${SITE_URL}/#localbusiness`,
    },
    mainEntity: {
      "@id": `${SITE_URL}/#localbusiness`,
    },
  };

  return (
    <>
      {/* JSON-LD: LocalBusiness + AboutPage */}
      <Script
        id="jsonld-localbusiness"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
      />
      <Script
        id="jsonld-aboutpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAboutPage) }}
      />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-zinc-900 text-white">
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative pt-[108px] sm:pt-[124px] lg:pt-[140px] pb-16 sm:pb-20 lg:pb-24">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-3">
                About {BUSINESS_NAME}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/85 max-w-[820px]">
                Family-owned ironwork and metal fabrication serving Washington, DC, Maryland,
                and Northern Virginia since 2000.
              </p>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
                  Built on craftsmanship, integrity, and family values
                </h2>
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  Paradise Ironworks was founded in 2000 by <strong>Ronald Brown</strong>, a retired
                  Prince George’s County firefighter, with a simple mission: build high-quality metalwork
                  the right way and stand behind every job.
                </p>
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  What began as a small, family-run operation—operated by Ronald, his wife, and their
                  four sons—has grown into a trusted name for ironwork across residential and commercial
                  sectors. Today we remain hands-on and detail-driven, combining shop craftsmanship with
                  clean, accurate field installation.
                </p>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
                  Residential, commercial, and structural experience
                </h2>
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  With over two decades of experience, we fabricate and install railings, gates, fencing,
                  stairs, and structural steel components for homeowners, property managers, and general
                  contractors throughout the DMV.
                </p>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "Interior & exterior railings",
                    "Driveway & walk gates",
                    "Fencing & security barriers",
                    "Commercial handrails & guards",
                    "Access-controlled gates",
                    "Structural steel supports & misc. steel",
                  ].map((item) => (
                    <li key={item} className="rounded-xl border bg-zinc-50 px-4 py-3 text-zinc-800">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">
                  Trusted on demanding projects
                </h2>
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  Our team has worked alongside respected construction partners including Clark Construction,
                  Hensel Phelps, and Whiting-Turner. Whether we’re supporting a larger build or completing a
                  standalone scope, we prioritize schedule clarity, safety, and durable finish quality.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/quote"
                  className="inline-flex items-center justify-center rounded-[10px] bg-[#fb5411] px-6 py-3 sm:px-7 sm:py-3.5 text-white text-base sm:text-lg font-medium hover:bg-[#e64d0f] transition-colors"
                >
                  Get a Free Quote
                </Link>
                <Link
                  href="/ironwork-projects"
                  className="inline-flex items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-6 py-3 sm:px-7 sm:py-3.5 text-zinc-900 text-base sm:text-lg font-medium hover:bg-zinc-50 transition-colors"
                >
                  View Our Work
                </Link>
              </div>
            </div>

            {/* SIDEBAR (Local relevance + quick facts) */}
            <aside className="lg:col-span-1">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-zinc-900">Service Area</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Serving Washington, DC, Maryland, and Northern Virginia.
                </p>

                <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                  {AREA_SERVED.slice(0, 6).map((place) => (
                    <li key={place} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-zinc-900" aria-hidden="true" />
                      <span>{place}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t pt-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Call</h3>
                  <a className="mt-2 inline-block text-[#fb5411] font-medium" href={`tel:${PHONE}`}>
                    301-441-4919
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
