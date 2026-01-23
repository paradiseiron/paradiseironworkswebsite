"use client";

import { useMemo, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { projects } from "@/data/projects";
import type { ProjectDetails, WorkType, ProductType } from "@/data/projects";

/**
 * Next/Image friendly:
 * - works with "/public" string paths
 * - works with imported StaticImageData
 */
type NextImageLike = StaticImageData | string;

function asNextImageSrc(src: unknown): NextImageLike {
  if (typeof src === "string") return src;
  if (src && typeof src === "object" && "src" in (src as any)) return src as StaticImageData;
  return "";
}

type WorkTypeFilter = "All" | WorkType;
type ProductTypeFilter = "All" | ProductType;
type LocationFilter = "All" | string;

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs border border-zinc-200">
      {children}
    </span>
  );
}

/** ✅ Generic select fixes TS setState mismatch */
function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-zinc-700">{label}</label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="
            w-full appearance-none
            px-4 py-2.5 pr-11
            border border-zinc-300 rounded-lg
            bg-white
            focus:outline-none focus:ring-2 focus:ring-amber-500
          "
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectDetails }) {
  const imgSrc = asNextImageSrc(project.image);

  const inner = (
    <>
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
        <Image
          src={imgSrc}
          alt={project.alt ?? `${project.workType} ${project.productType}: ${project.name}`}
          fill
          sizes="(min-width: 1280px) 260px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-[16px] sm:text-[18px] leading-[24px] font-medium text-zinc-900 mb-2">
          {project.name}
        </h3>

        <div className="space-y-1 text-sm text-zinc-600">
          <p className="inline-flex items-center gap-2">
            <span className="size-2 bg-amber-500 rounded-full" aria-hidden="true" />
            {project.location}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <Tag>{project.workType}</Tag>
            <Tag>{project.productType}</Tag>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-lg transition-shadow">
      <Link
        href={`/SeeWork/${project.slug}`}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {inner}
      </Link>
    </div>
  );
}

export default function GalleryPage() {
  // Build filter options from data so you never “break” UI again when adding projects
  const workTypes = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.workType)))].sort() as WorkTypeFilter[],
    []
  );

  const productTypes = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.productType)))].sort() as ProductTypeFilter[],
    []
  );

  const locations = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.location)))].sort() as LocationFilter[],
    []
  );

  const [selectedWorkType, setSelectedWorkType] = useState<WorkTypeFilter>("All");
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeFilter>("All");
  const [selectedLocation, setSelectedLocation] = useState<LocationFilter>("All");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesWorkType = selectedWorkType === "All" || project.workType === selectedWorkType;
      const matchesProductType = selectedProductType === "All" || project.productType === selectedProductType;
      const matchesLocation = selectedLocation === "All" || project.location === selectedLocation;
      return matchesWorkType && matchesProductType && matchesLocation;
    });
  }, [selectedWorkType, selectedProductType, selectedLocation]);

  const clearFilters = () => {
    setSelectedWorkType("All");
    setSelectedProductType("All");
    setSelectedLocation("All");
  };

  const hasActiveFilters =
    selectedWorkType !== "All" || selectedProductType !== "All" || selectedLocation !== "All";

  return (
    <div>
      {/* ✅ HERO with background image + header-safe padding */}
      <div className="relative overflow-hidden bg-zinc-900 text-white">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/welding_shop_sparks.jpg"
            alt="Welding sparks in the shop"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Overlays for readability */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
        </div>

        {/* Content */}
        <div className="relative pt-[108px] sm:pt-[124px] lg:pt-[140px] pb-16 sm:pb-20 lg:pb-24">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-3">Our Work</h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/85">
              Explore our portfolio of {projects.length} completed ironwork projects.
            </p>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Filters */}
        <div className="mb-8 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl text-zinc-900">Filter Projects</h2>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 self-start sm:self-auto"
                type="button"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <SelectField
              label="Work Type"
              value={selectedWorkType}
              onChange={setSelectedWorkType}
              options={workTypes}
            />
            <SelectField
              label="Product Type"
              value={selectedProductType}
              onChange={setSelectedProductType}
              options={productTypes}
            />
            <SelectField
              label="Location"
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={locations}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {hasActiveFilters ? (
              <div className="flex flex-wrap gap-2">
                {selectedWorkType !== "All" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-sm">
                    {selectedWorkType}
                    <button type="button" aria-label="Remove work type filter" onClick={() => setSelectedWorkType("All")}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedProductType !== "All" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-sm">
                    {selectedProductType}
                    <button
                      type="button"
                      aria-label="Remove product type filter"
                      onClick={() => setSelectedProductType("All")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedLocation !== "All" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-sm">
                    {selectedLocation}
                    <button
                      type="button"
                      aria-label="Remove location filter"
                      onClick={() => setSelectedLocation("All")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            ) : (
              <div />
            )}

            <button
              onClick={clearFilters}
              type="button"
              className="
                px-5 py-2.5
                border border-zinc-300 text-zinc-800
                rounded-xl
                hover:border-amber-500 hover:text-amber-700
                transition-colors
                inline-flex items-center justify-center gap-2
                w-full sm:w-auto
              "
            >
              <X className="w-4 h-4" />
              Reset filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-zinc-600">
            Showing <span className="text-zinc-900 font-medium">{filteredProjects.length}</span> of{" "}
            <span className="text-zinc-900 font-medium">{projects.length}</span> projects
          </p>
        </div>

        {/* Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 sm:py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-100 rounded-full mb-4">
              <X className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-lg sm:text-xl mb-2 text-zinc-900">No projects found</h3>
            <p className="text-zinc-600 mb-4">Try adjusting your filters to see more results.</p>
            <button onClick={clearFilters} className="text-amber-700 hover:text-amber-800" type="button">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
