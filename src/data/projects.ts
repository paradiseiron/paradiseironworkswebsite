// src/data/projects.ts

export type WorkType = "Residential" | "Commercial" | "Structural";

export type ProductType =
  | "Interior Railings"
  | "Exterior Railings"
  | "Gates"
  | "Fencing"
  | "Storm Doors"
  | "Balconies"
  | "Architectural Metalwork"
  | "Structural Steel";

export type ProjectSpec = { label: string; value: string };
export type ProjectImage = { src: string; alt: string };

/**
 * ✅ ProjectDetails = single source of truth used by:
 * - Gallery (thumbnail, filters)
 * - [slug] detail page
 */
export type ProjectDetails = {
  id: number;
  slug: string;

  name: string;
  location: string;
  workType: WorkType;
  productType: ProductType;

  // Gallery thumbnail
  image: string;
  alt?: string;

  // Detail page (optional for older items until you add them)
  description?: string;
  year?: number;
  images?: ProjectImage[];
  specifications?: ProjectSpec[];

  // Optional SEO fields (safe to add now)
  summary?: string;
  seoTitle?: string;
  metaDescription?: string;
};

export function normalizeSlug(input: string) {
  return decodeURIComponent(input).trim().toLowerCase();
}

/**
 * ✅ Make sure EVERY project you link to has a slug here.
 * Also: slugs should match URLs exactly (case + hyphens).
 */
export const projects: ProjectDetails[] = [
  {
    id: 1,
    slug: "custom-entry-gate",
    name: "Custom Entry Gate",
    location: "Washington, DC",
    workType: "Commercial",
    productType: "Gates",
    image: "/images/double-swing-security-gate-steel-mesh-dc.jpeg",
    alt: "Custom steel entry gate in Washington, DC",
    // (optional detail fields can be added later)
    images: [
      {
        src: "/images/double-swing-security-gate-steel-mesh-dc.jpeg",
        alt: "Custom steel entry gate in Washington, DC",
      },
    ],
    specifications: [],
  },
  {
    id: 2,
    slug: "cable-railing",
    name: "Cable Railing",
    location: "DMV Area",
    workType: "Commercial",
    productType: "Exterior Railings",
    image: "/images/stainless-cable-railing-exterior-commercial-dc.jpeg",
    alt: "Commercial exterior cable railing in the DMV area",
    images: [
      {
        src: "/images/stainless-cable-railing-exterior-commercial-dc.jpeg",
        alt: "Commercial exterior cable railing in the DMV area",
      },
    ],
    specifications: [],
  },
  {
    id: 3,
    slug: "structural-steel-installation",
    name: "Structural Steel Installation",
    location: "DMV Area",
    workType: "Structural",
    productType: "Structural Steel",
    image: "/images/structural-steel-erection-commercial-building-dc.jpeg",
    alt: "Structural steel erection for a commercial building in the DMV area",
    images: [
      {
        src: "/images/structural-steel-erection-commercial-building-dc.jpeg",
        alt: "Structural steel erection for a commercial building in the DMV area",
      },
    ],
    specifications: [],
  },
  {
    id: 4,
    slug: "steel-canopy-frame",
    name: "Steel Canopy Frame Installation",
    location: "DMV Area",
    workType: "Commercial",
    productType: "Architectural Metalwork",
    image: "/images/commercial-steel-canopy-frame-fabrication-installation.jpg",
    alt: "Commercial steel canopy frame fabrication and installation",
    images: [
      {
        src: "/images/commercial-steel-canopy-frame-fabrication-installation.jpg",
        alt: "Commercial steel canopy frame fabrication and installation",
      },
    ],
    specifications: [],
  },
  {
    id: 5,
    slug: "exterior-railing",
    name: "Exterior Railing",
    location: "Maryland",
    workType: "Residential",
    productType: "Exterior Railings",
    image: "/images/residential-exterior-stairs-metal-railings-md.jpeg",
    alt: "Residential exterior stair railing in Maryland",
    images: [
      {
        src: "/images/residential-exterior-stairs-metal-railings-md.jpeg",
        alt: "Residential exterior stair railing in Maryland",
      },
    ],
    specifications: [],
  },
  {
    id: 6,
    slug: "interior-railing",
    name: "Interior Railing",
    location: "Virginia",
    workType: "Residential",
    productType: "Interior Railings",
    image: "/images/modern-interior-stair-railing-horizontal-metal-black.jpg",
    alt: "Modern black horizontal interior stair railing",
    images: [
      {
        src: "/images/modern-interior-stair-railing-horizontal-metal-black.jpg",
        alt: "Modern black horizontal interior stair railing",
      },
    ],
    specifications: [],
  },

  // ✅ Mount Rainier project (your new one)
  {
    id: 7,
    slug: "interior-stair-railing-mount-rainier-maryland",
    name: "Mount Rainier Railing",
    location: "Mount Rainier, MD",
    workType: "Residential",
    productType: "Interior Railings",

    // IMPORTANT: this thumbnail must exist under /public
    image: "/images/work/residential-modern-interior-metal-railing-mount-rainier-maryland-01.JPG",
    alt: "Interior railing in Mount Rainier, MD - overview",

    description:
      "Custom interior railing fabricated and installed for a residential property in Mount Rainier. Built for durability, code compliance, and long-term weather resistance while maintaining a clean, modern look.",
    year: 2026,
    images: [
      {
        src: "/images/work/residential-modern-interior-metal-railing-mount-rainier-maryland-01.JPG",
        alt: "Interior railing in Mount Rainier, MD - overview",
      },
      {
        src: "/images/work/residential-modern-interior-metal-railing-mount-rainier-maryland-02.JPG",
        alt: "Interior railing - detail view of posts and fasteners",
      },
      {
        src: "/images/work/residential-modern-interior-metal-railing-mount-rainier-maryland-03.JPG",
        alt: "Interior railing - angle view along stair run",
      },
    ],
    specifications: [
      { label: "Material", value: "Steel" },
      { label: "Finish", value: "Powder coat" },
      { label: "Use", value: "Exterior / weather-resistant" },
      { label: "Code", value: "Installed to local code requirements" },
    ],
  },
];

export function getProjectBySlug(slug: string) {
  const needle = normalizeSlug(slug);
  return projects.find((p) => normalizeSlug(p.slug) === needle);
}
