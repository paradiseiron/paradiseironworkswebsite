// src/components/ServicePage.tsx
import Image from "next/image";
import Link from "next/link";

// Adjust these imports to match your project
import { projects } from "@/data/projects";

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

type ServiceKey = "residential" | "commercial" | "structural";

type CredentialLogo = {
  src: string; // "/public" path
  alt: string;
  href?: string; // optional external link
};

type ServiceCredentials = {
  title?: string;
  description: string;
  naicsCodes?: string[];
  contractors?: CredentialLogo[]; // "Trusted by"
  owners?: CredentialLogo[]; // "On projects for"
};

type ServiceConfig = {
  key: ServiceKey;
  title: string;
  subtitle: string;
  heroImageSrc: string;
  heroImageAlt: string;
  description: string;
  exampleWork: string[];
  heroPosition?: string;
  matchesProject: (p: any) => boolean;

  // Optional (commercial / structural)
  credentials?: ServiceCredentials;
};

function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/ironwork-projects/${project.slug}`}
      className="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={project.image}
          alt={project.alt ?? project.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="p-5">
        <div className="text-sm text-neutral-500">{project.location}</div>
        <div className="mt-1 text-lg font-semibold text-neutral-900">
          {project.name}
        </div>
        {project.summary ? (
          <p className="mt-2 text-sm text-neutral-600">{project.summary}</p>
        ) : null}

        <div className="mt-4 inline-flex items-center text-sm font-medium">
          View project →
        </div>
      </div>
    </Link>
  );
}

function LogoGrid({
  title,
  logos,
}: {
  title: string;
  logos?: CredentialLogo[];
}) {
  // For commercial/structural only; keep quiet if empty
  if (!logos?.length) return null;

  return (
    <div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-8 items-center">
        {logos.map((logo) => {
          const image = (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={260}
              height={120}
              className="w-full max-w-[220px] h-auto object-contain opacity-80 transition-opacity hover:opacity-100"
            />
          );

          return logo.href ? (
            <a
              key={logo.src}
              href={logo.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center"
              aria-label={logo.alt}
            >
              {image}
            </a>
          ) : (
            <div key={logo.src} className="flex items-center justify-center">
              {image}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ServicePage({ service }: { service: ServiceConfig }) {
  const featured = projects.filter(service.matchesProject).slice(0, 6);

  const showCredentials = service.key !== "residential" && !!service.credentials;

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-[52vh] min-h-[420px] w-full">
          <Image
            src={service.heroImageSrc}
            alt={service.heroImageAlt}
            fill
            priority
            className={`object-cover ${service.heroPosition ?? "object-center"}`}
            sizes="100vw"
          />

          <div className="absolute inset-0 bg-black/45" />

          <div className="absolute inset-0">
            <div className="mx-auto flex h-full w-full max-w-6xl items-end px-6 pb-12">
              <div className="max-w-3xl">
                <h1 className="mt-2 text-3xl font-semibold text-white md:text-5xl">
                  {service.title}
                </h1>
                <p className="mt-4 text-base text-white/90 md:text-lg">
                  {service.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION + EXAMPLES */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              What we do
            </h2>

            <p className="mt-4 leading-relaxed text-neutral-700 whitespace-pre-line">
              {service.description}
            </p>

            {/* ✅ Residential-only MHIC line (simple, no logos/extra headings) */}
            {service.key === "residential" ? (
              <p className="mt-6 text-sm text-neutral-700">
                <span className="font-semibold">MHIC License:</span>{" "}
                Maryland Home Improvement Contractor #123456
              </p>
            ) : null}

            <div className="mt-8">
              <a
                href="tel:+12022404400"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-[10px]
                  border border-black
                  px-6 py-3 sm:px-7 sm:py-3.5
                  text-black text-base sm:text-lg font-medium
                  transition-colors
                  hover:bg-black hover:text-white
                "
              >
                <PhoneIcon className="size-5" />
                Call Now: 202-240-4400
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              Common project types
            </h3>

            <ul className="mt-4 grid gap-3">
              {service.exampleWork.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border bg-neutral-50 px-4 py-3 text-neutral-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ✅ CREDENTIALS SECTION (commercial/structural only) */}
      {showCredentials ? (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Copy + NAICS */}
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {service.credentials!.title ?? "Credentials & Past Performance"}
                </h2>

                <p className="mt-4 leading-relaxed text-neutral-700 whitespace-pre-line">
                  {service.credentials!.description}
                </p>

                {service.credentials!.naicsCodes?.length ? (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-neutral-900">
                      NAICS codes
                    </h3>

                    <ul className="mt-3 space-y-2">
                      {service.credentials!.naicsCodes!.map((code) => (
                        <li
                          key={code}
                          className="flex items-start gap-2 text-neutral-700"
                        >
                          <span
                            className="mt-2 size-1.5 rounded-full bg-neutral-900"
                            aria-hidden="true"
                          />
                          <span>{code}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* Logos column: Trusted by + On projects for */}
              <div className="space-y-10">
                <LogoGrid
                  title="Trusted by"
                  logos={service.credentials!.contractors}
                />
                <LogoGrid
                  title="On projects for"
                  logos={service.credentials!.owners}
                />

                <p className="text-sm text-neutral-500">
                  Logos shown for identification only. All trademarks belong to
                  their respective owners.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* FEATURED PROJECTS */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              Featured projects
            </h2>
            <p className="mt-2 text-neutral-600">
              A few examples in this category.
            </p>
          </div>

          <Link
            href="/ironwork-projects"
            className="text-sm font-semibold text-neutral-900 hover:underline"
          >
            View all work →
          </Link>
        </div>

        {featured.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p: any) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border bg-neutral-50 p-8 text-neutral-700">
            No featured projects found for this service yet.
          </div>
        )}
      </section>
    </main>
  );
}
