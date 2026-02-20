// src/app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Paradise Ironworks | Washington DC, Maryland & Virginia Metal Fabrication",
  description:
    "Contact Paradise Ironworks for scheduling, general questions, repairs, and commercial inquiries. Serving Washington, DC, Maryland, and Northern Virginia.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Paradise Ironworks",
    description:
      "Get in touch for scheduling, general questions, repairs, and commercial inquiries across DC, MD, and Northern VA.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  const businessName = "Paradise Ironworks";
  const phoneDisplay = "301- 441-4919";
  const phoneHref = "+13014414919";
  const email = "info@paradiseironworks.com"; // <- change if needed

  // IMPORTANT: Replace with your real address if you want NAP accuracy on-page
  const address = {
    street: "5110 Lakeland Rd",
    city: "College Park",
    region: "MD",
    postalCode: "20740",
    country: "US",
  };

  // If you prefer not to show street address publicly, you can keep it off-page
  // and still mention the service area. But JSON-LD should match reality.

  const serviceAreas = [
    "Washington, DC",
    "Montgomery County, MD",
    "Prince George’s County, MD",
    "Anne Arundel County, MD",
    "Baltimore, MD",
    "Arlington, VA",
    "Alexandria, VA",
    "Fairfax County, VA",
  ];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Do you service my area?",
      a: "We serve Washington, DC, Maryland, and Northern Virginia. If you’re nearby but not listed, contact us and we’ll confirm coverage.",
    },
    {
      q: "What should I use the Quote page for?",
      a: "Use the Quote page when you’re ready to request pricing and want to share project details/photos. This Contact page is best for scheduling, general questions, repairs, and commercial inquiries.",
    },
    {
      q: "Do you handle commercial and multi-unit properties?",
      a: "Yes. We regularly work with property managers and general contractors on railings, gates, repairs, and custom metal fabrication for commercial properties.",
    },
    {
      q: "Do you do repairs?",
      a: "Yes—depending on the scope and access. Send a brief description and a few photos on the Quote page, or contact us here to confirm availability.",
    },
    {
      q: "What’s a typical lead time?",
      a: "Lead times vary based on scope, permitting/approvals, and production schedule. Contact us with your timeline and we’ll advise next steps.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessName,
    telephone: `+1${phoneDisplay.replace(/[^0-9]/g, "")}`,
    email,
    url: "https://www.paradiseironworks.com/contact", // <- update your real domain
    areaServed: serviceAreas,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    // You can add geo if you want:
    // geo: { "@type": "GeoCoordinates", latitude: 38.9072, longitude: -77.0369 },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:00",
        closes: "16:00",
      },
    ],
  };

  return (
    <main className="bg-white">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto max-w-6xl px-6 pt-[120px] pb-14 sm:pt-[140px] sm:pb-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold text-neutral-900 md:text-5xl">
              Contact {businessName}
            </h1>
            <p className="mt-4 text-base text-neutral-700 md:text-lg">
              For scheduling, general questions, repairs, and commercial inquiries.
              If you’re ready for pricing and want to share project details/photos, use our{" "}
              <Link href="/quote" className="font-semibold text-neutral-900 underline underline-offset-4">
                Get a Free Quote
              </Link>{" "}
              page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={`tel:${phoneHref}`}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-[10px] bg-[#fb5411]
                  px-6 py-3 sm:px-7 sm:py-3.5
                  text-white text-base sm:text-lg font-medium
                  hover:bg-[#e64d0f] transition-colors
                "
              >
                Call Now: {phoneDisplay}
              </a>

              <a
                href={`mailto:${email}`}
                className="
                  inline-flex items-center justify-center
                  rounded-[10px] border border-black
                  px-6 py-3 sm:px-7 sm:py-3.5
                  text-black text-base sm:text-lg font-medium
                  transition-colors
                  hover:bg-black hover:text-white
                "
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Quick contact</h2>
            <p className="mt-2 text-neutral-700">
              Fastest response is usually by phone. Email is great for non-urgent questions.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <div className="text-sm font-semibold text-neutral-900">Phone</div>
                <a className="text-neutral-700 underline underline-offset-4" href={`tel:${phoneHref}`}>
                  {phoneDisplay}
                </a>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Email</div>
                <a className="text-neutral-700 underline underline-offset-4" href={`mailto:${email}`}>
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Service area</h2>
            <p className="mt-2 text-neutral-700">
              We serve the DMV with custom ironwork and metal fabrication for residential and commercial properties.
            </p>

            <ul className="mt-4 grid gap-2 text-neutral-700">
              {serviceAreas.slice(0, 6).map((area) => (
                <li key={area} className="flex items-start gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-neutral-900" aria-hidden="true" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 text-sm text-neutral-600">
              Don’t see your location? Contact us and we’ll confirm.
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Hours & scheduling</h2>
            <p className="mt-2 text-neutral-700">
              Tell us your ideal timeline and we’ll coordinate next steps.
            </p>

            <div className="mt-4 space-y-2 text-neutral-700">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-neutral-900">Mon–Fri</span>
                <span>7:00 AM – 4:00 PM</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-neutral-900">Sat–Sun</span>
                <span>Closed</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center rounded-[10px] bg-neutral-900 px-5 py-3 text-white font-medium hover:bg-neutral-800 transition-colors w-full"
              >
                Start a Quote Request →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAP + ADDRESS (optional) */}
      <section className="mx-auto max-w-6xl px-6 pb-12 sm:pb-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Location</h2>
            <p className="mt-2 text-neutral-700">
              If you’re meeting us on-site or coordinating delivery, use the details below.
            </p>

            <div className="mt-4 text-neutral-700">
              <div className="font-semibold text-neutral-900">{businessName}</div>
              <div>{address.street}</div>
              <div>
                {address.city}, {address.region} {address.postalCode}
              </div>
            </div>

            <p className="mt-4 text-sm text-neutral-600">
              Tip: For project pricing and attachments, use the Quote page so everything stays tied to your request.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50">
            {/* Replace the src with your real Google Maps embed URL */}
            <iframe
              title="Map"
              className="h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Washington%20DC&output=embed"
            />
          </div>
        </div>
      </section>

      {/* FAQ (SEO-friendly) */}
     <section
  id="faq"
  className="mx-auto max-w-6xl px-6 pb-16 scroll-mt-28">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-neutral-900">Contact FAQs</h2>
          <div className="mt-6 grid gap-4">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <summary className="cursor-pointer list-none font-semibold text-neutral-900">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
