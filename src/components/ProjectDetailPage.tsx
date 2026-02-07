// src/components/ProjectDetailPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Briefcase,
} from "lucide-react";

import type { ProjectDetails, ProjectImage, ProjectSpec } from "@/data/projects";

export default function ProjectDetailsPage({
  project,
}: {
  project: ProjectDetails;
}) {
  const images: ProjectImage[] = project.images ?? [];
  const specifications: ProjectSpec[] = project.specifications ?? [];

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const hasMany = images.length > 1;

  const currentImage = useMemo(() => images[current], [images, current]);

  const openLightbox = (index: number) => {
    setCurrent(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () =>
    setCurrent((prev) => (prev - 1 + images.length) % images.length);

  // Keyboard support (Esc closes, arrows navigate)
  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (!hasMany) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, hasMany, images.length]);

  return (
    <main className="min-h-screen bg-zinc-50 pt-[108px] sm:pt-[124px] lg:pt-[140px]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Back to Gallery */}
        <div className="mb-8">
          <Link
            href="/ironwork-projects"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-amber-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Gallery
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main content */}
          <section className="lg:col-span-2">
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-zinc-900 mb-4">
              {project.name}
            </h1>

            <div className="flex flex-wrap gap-4 mb-6">
              <span className="inline-flex items-center gap-2 text-zinc-600">
                <MapPin className="w-5 h-5 text-amber-600" />
                {project.location}
              </span>

              <span className="inline-flex items-center gap-2 text-zinc-600">
               <Briefcase className="w-5 h-5 text-amber-600" />
               <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs border border-zinc-200">
               {project.workType}
               </span>
             </span>

              <span className="inline-flex items-start gap-2 text-zinc-600">
             <Tag className="w-5 h-5 text-amber-600 mt-[2px]" />

             <span className="flex flex-wrap gap-2">
               {Array.isArray(project.productTypes) ? (
               project.productTypes.map((pt) => (
              <span
               key={pt}
               className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs border border-zinc-200"
               >
                {pt}
              </span>
      ))
    ) : (
      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs border border-zinc-200">
        {String(project.productTypes ?? "")}
      </span>
    )}
  </span>
</span>
            </div>

            {project.description && (
              <p className="text-lg text-zinc-700 leading-relaxed mb-10">
                {project.description}
              </p>
            )}

            {/* Gallery */}
            {images.length > 0 && (
              <>
                <h2 className="text-2xl font-medium text-zinc-900 mb-4">
                  Project Gallery
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img: ProjectImage, idx: number) => (
                    <button
                      key={`${img.src}-${idx}`}
                      type="button"
                      onClick={() => openLightbox(idx)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      aria-label={`Open image ${idx + 1} of ${images.length}`}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 1024px) 260px, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200">
              <h2 className="text-xl font-medium text-zinc-900 mb-4">
                Project Details
              </h2>

              {typeof project.year === "number" && (
                <div className="mb-6">
                  <div className="text-sm text-zinc-600 mb-1">
                    Year Completed
                  </div>
                  <div className="text-zinc-900">{project.year}</div>
                </div>
              )}

              {specifications.length > 0 && (
                <div className="border-t border-zinc-200 pt-6">
                  <h3 className="text-lg font-medium text-zinc-900 mb-4">
                    Specifications
                  </h3>

                  <div className="space-y-3">
                    {specifications.map((spec: ProjectSpec, idx: number) => (
                      <div key={`${spec.label}-${idx}`}>
                        <div className="text-sm text-zinc-600">{spec.label}</div>
                        <div className="text-zinc-900">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && currentImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 text-white hover:text-amber-400 z-50"
            aria-label="Close"
            type="button"
          >
            <X className="w-8 h-8" />
          </button>

          {hasMany && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 text-white hover:text-amber-400 z-50"
                aria-label="Previous image"
                type="button"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 text-white hover:text-amber-400 z-50"
                aria-label="Next image"
                type="button"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </>
          )}

          <div
            className="relative w-[min(1100px,92vw)] h-[min(78vh,800px)] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              sizes="(min-width: 1024px) 1100px, 92vw"
              className="object-contain"
              priority
            />

            <div className="absolute -bottom-10 left-0 right-0 text-center text-white/90">
              {current + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          {hasMany && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {images.map((img: ProjectImage, idx: number) => (
                <button
                  key={`${img.src}-thumb-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrent(idx);
                  }}
                  className={`relative w-16 h-16 overflow-hidden rounded border-2 transition-all ${
                    idx === current
                      ? "border-amber-500 scale-110"
                      : "border-white/40 hover:border-amber-500"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                  type="button"
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
