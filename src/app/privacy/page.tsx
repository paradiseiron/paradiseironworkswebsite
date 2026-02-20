// app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Paradise Ironworks & Construction",
  description:
    "Privacy Policy for Paradise Ironworks & Construction. Learn what information we collect, how we use it, and your choices.",
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

export default function PrivacyPolicyPage() {
  return (
    <main className="px-6">

      {/* ✅ HEADER OFFSET (tuned for your fixed header) */}
      <div className="mx-auto w-full max-w-4xl pt-[120px] sm:pt-[140px] pb-20">

        {/* Page Intro */}
        <header className="space-y-4 border-b border-zinc-200 pb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900">
            Privacy Policy
          </h1>

          <p className="text-zinc-700 leading-relaxed">
            <span className="font-medium text-zinc-900">
              {BUSINESS.name}
            </span>{" "}
            (“we,” “us,” or “our”) values your privacy. This Privacy Policy
            explains what information we collect, how we use it, and the
            choices you have.
          </p>

          <p className="text-sm text-zinc-500">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        {/* Content */}
        <div className="mt-10 space-y-12">

          <Section title="Who this policy applies to">
            <p>
              This policy applies to visitors of our website and individuals
              who contact us for estimates or services in{" "}
              {BUSINESS.serviceRegion}.
            </p>
          </Section>

          <Section title="Information we collect">
            <h3 className="font-semibold text-zinc-900">
              Information you provide
            </h3>

            <Bullets>
              <li>Name, email address, and phone number</li>
              <li>Project details submitted through contact or quote forms</li>
              <li>Photos or attachments you choose to send</li>
            </Bullets>

            <h3 className="pt-2 font-semibold text-zinc-900">
              Information collected automatically
            </h3>

            <Bullets>
              <li>IP address and approximate location</li>
              <li>Browser and device information</li>
              <li>Pages viewed and general interaction data</li>
              <li>Referring or exit pages</li>
            </Bullets>
          </Section>

          <Section title="How we use your information">
            <Bullets>
              <li>To respond to inquiries and provide estimates</li>
              <li>To deliver and improve our services</li>
              <li>To maintain website security and prevent spam</li>
              <li>To analyze website performance</li>
              <li>To comply with legal obligations</li>
            </Bullets>
          </Section>

          <Section title="Cookies">
            <p>
              Our website may use cookies and similar technologies to ensure
              proper functionality and analyze usage. You may control cookies
              through your browser settings. Disabling cookies may affect some
              features of the site.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>
              We may use third-party services such as hosting providers,
              analytics tools, and email systems to operate our website and
              communicate with customers. These providers process data in
              accordance with their own privacy policies.
            </p>
          </Section>

          <Section title="How we share information">
            <p>We do not sell personal information. We may share data only:</p>
            <Bullets>
              <li>With service providers assisting our operations</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and business interests</li>
            </Bullets>
          </Section>

          <Section title="Data retention">
            <p>
              We retain personal information only as long as necessary to
              fulfill inquiries, provide services, and comply with legal
              obligations.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We implement reasonable safeguards to protect your information.
              However, no online transmission or storage method is completely
              secure.
            </p>
          </Section>

          <Section title="Your rights">
            <Bullets>
              <li>You may request access to your information.</li>
              <li>You may request correction or deletion.</li>
              <li>You may opt out of marketing communications.</li>
            </Bullets>
          </Section>

          <Section title="Children’s privacy">
            <p>
              Our website is not directed to children under 13, and we do not
              knowingly collect personal information from children.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this Privacy Policy periodically. Updates will be
              reflected in the “Last updated” date above.
            </p>
          </Section>

          <Section title="Contact us">
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
              Also see our{" "}
              <Link
                href="/terms"
                className="text-amber-700 hover:text-amber-800"
              >
                Terms of Service
              </Link>.
            </p>
          </Section>

        </div>
      </div>
    </main>
  );
}
