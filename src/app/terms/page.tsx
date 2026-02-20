// app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Paradise Ironworks & Construction",
  description:
    "Terms of Service for Paradise Ironworks & Construction. Learn the terms governing use of our website and services.",
};

const BUSINESS = {
  name: "Paradise Ironworks & Construction",
  serviceRegion: "Washington, DC, Maryland, and Northern Virginia",
  email: "info@customironworks.com", // 🔴 Replace
  phoneDisplay: "(301) 441-4919", // 🔴 Replace
  phoneE164: "+13014414919", // 🔴 Replace
};

const LAST_UPDATED = "February 12, 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      <div className="space-y-3 text-zinc-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2">{children}</ul>;
}

export default function TermsPage() {
  return (
    <main className="px-6">
      {/* Header offset for fixed header */}
      <div className="mx-auto w-full max-w-4xl pt-[120px] sm:pt-[140px] pb-20">

        {/* Intro */}
        <header className="space-y-4 border-b border-zinc-200 pb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900">
            Terms of Service
          </h1>

          <p className="text-zinc-700 leading-relaxed">
            These Terms of Service (“Terms”) govern your use of the website and
            services provided by{" "}
            <span className="font-medium text-zinc-900">
              {BUSINESS.name}
            </span>{" "}
            (“we,” “us,” or “our”).
          </p>

          <p className="text-sm text-zinc-500">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <div className="mt-10 space-y-12">

          <Section title="Use of our website">
            <p>
              By accessing this website, you agree to use it for lawful
              purposes only. You may not use this site in any way that
              violates applicable laws or regulations.
            </p>
          </Section>

          <Section title="Estimates and proposals">
            <p>
              Any estimates, quotes, or proposals provided through our website
              or by direct communication are non-binding unless confirmed in a
              signed written agreement.
            </p>
            <p>
              Pricing may vary based on site conditions, material costs,
              design changes, permitting requirements, or other unforeseen
              circumstances.
            </p>
          </Section>

          <Section title="Project agreements">
            <p>
              All construction or fabrication work is governed by the specific
              contract or written agreement executed between you and{" "}
              {BUSINESS.name}. In the event of a conflict between these Terms
              and a signed agreement, the signed agreement controls.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              All content on this website—including text, images, project
              photos, designs, logos, and graphics—is the property of{" "}
              {BUSINESS.name} unless otherwise stated.
            </p>

            <Bullets>
              <li>You may not reproduce or reuse website content without permission.</li>
              <li>You may not use project images for commercial purposes without written consent.</li>
            </Bullets>
          </Section>

          <Section title="Accuracy of information">
            <p>
              We strive to ensure that information on this website is accurate
              and up to date. However, we make no warranties or guarantees
              regarding the completeness or accuracy of any content.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the fullest extent permitted by law,{" "}
              {BUSINESS.name} shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of
              this website.
            </p>
            <p>
              This includes, but is not limited to, loss of data, business
              interruption, or website unavailability.
            </p>
          </Section>

          <Section title="Third-party links">
            <p>
              Our website may contain links to third-party websites. We are
              not responsible for the content, policies, or practices of those
              websites.
            </p>
          </Section>

          <Section title="Indemnification">
            <p>
              You agree to indemnify and hold harmless {BUSINESS.name} from
              any claims, damages, or expenses arising from your misuse of
              this website.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These Terms shall be governed by and interpreted in accordance
              with the laws of the jurisdictions in which we operate,
              including {BUSINESS.serviceRegion}.
            </p>
          </Section>

          <Section title="Changes to these Terms">
            <p>
              We may update these Terms from time to time. Updates will be
              reflected in the “Last updated” date above.
            </p>
          </Section>

          <Section title="Contact information">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-2">
              <p className="font-medium text-zinc-900">
                {BUSINESS.name}
              </p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="text-amber-700 hover:text-amber-800"
                >
                  {BUSINESS.email}
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href={`tel:${BUSINESS.phoneE164}`}
                  className="text-amber-700 hover:text-amber-800"
                >
                  {BUSINESS.phoneDisplay}
                </a>
              </p>
            </div>

            <p className="text-sm text-zinc-600">
              Please also review our{" "}
              <Link
                href="/privacy"
                className="text-amber-700 hover:text-amber-800"
              >
                Privacy Policy
              </Link>.
            </p>
          </Section>

        </div>
      </div>
    </main>
  );
}
