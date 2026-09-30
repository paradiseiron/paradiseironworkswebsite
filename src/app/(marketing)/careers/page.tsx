import type { Metadata } from "next";
import Image from "next/image";
import CareersListing from "@/components/CareersListing";
import { getPublishedJobs } from "@/lib/careers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Careers", description: "Explore career opportunities at Paradise Ironworks & Construction.", alternates: { canonical: "/careers" } };

export default async function CareersPage() {
  const jobs = await getPublishedJobs();
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="relative h-[52vh] min-h-[420px] w-full">
          <Image
            src="/images/careers_hero.jpg"
            alt="Welder at work in the Paradise Ironworks shop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0">
            <div className="mx-auto flex h-full w-full max-w-6xl items-end px-6 pb-12">
              <div className="max-w-3xl">
                <h1 className="mt-2 text-3xl font-semibold text-white md:text-5xl">
                  Paradise Ironworks is Looking for Talent
                </h1>
                <p className="mt-4 text-base text-white/90 md:text-lg">
                  Build lasting work with a team committed to craftsmanship,
                  safety, and service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <CareersListing jobs={jobs} />
    </main>
  );
}
