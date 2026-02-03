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
  productTypes: Exclude<ProductType, "All">[];


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
  slug: "commercial-security-gate-steel-mesh-reston-virginia",
  name: "Reston Commercial Security Gate + Handrail",
  location: "Reston, VA",
  workType: "Commercial",
  productTypes: ["Gates", "Exterior Railings"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-thumb.jpeg",
  alt: "Commercial steel mesh security gate and exterior handrail installation in Reston, VA - overview",

  description:
    "Commercial steel fabrication project completed in Reston, Virginia featuring a custom steel mesh security gate and an exterior steel handrail. Built for secure access control, long-term durability, and a clean professional finish suitable for high-traffic commercial environments.",
  year: 2026,

  images: [
    {
      src: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-01.jpg",
      alt: "Commercial steel mesh security gate in Reston, VA - full view",
    },
    {
      src: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-02.jpg",
      alt: "Steel mesh security gate - hinge side and frame detail",
    },
    {
      src: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-03.jpg",
      alt: "Commercial security gate - latch and hardware detail",
    },
    {
      src: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-04.jpg",
      alt: "Steel security gate installation - final alignment and fit",
    },

    // ✅ Exterior handrail images included in the same project
    {
      src: "/images/work/commercial-exterior-steel-handrail-reston-virginia-05.jpg",
      alt: "Commercial exterior steel handrail in Reston, VA - overview",
    },
    {
      src: "/images/work/commercial-exterior-steel-handrail-reston-virginia-06.jpg",
      alt: "Commercial exterior steel handrail - detail view of posts and connections",
    },
  ],

  // Optional SEO fields (safe to add now)
  summary:
    "Commercial steel fabrication in Reston, VA featuring a custom steel mesh security gate and exterior handrail—secure, durable, and finished for daily commercial use.",
  seoTitle:
    "Commercial Security Gate & Steel Handrail in Reston, VA | Paradise Ironworks",
  metaDescription:
    "Commercial steel mesh security gate and exterior steel handrail installed in Reston, Virginia. Custom fabricated for secure access, safety, and long-term durability. Get a quote from Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Powder coat" },
    { label: "Use", value: "Commercial / security + safety rail" },
    { label: "Code", value: "Installed to local code requirements" },
  ],
},

  {
    id: 3,
    slug: "structural-steel-installation",
    name: "Structural Steel Installation",
    location: "DMV Area",
    workType: "Structural",
    productTypes: ["Structural Steel"],
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
    productTypes: ["Architectural Metalwork"],
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
    productTypes: ["Exterior Railings"],
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
    productTypes: ["Interior Railings"],
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
    productTypes: ["Interior Railings"],

    // IMPORTANT: this thumbnail must exist under /public
    image: "/images/work/residential-modern-interior-metal-railing-mount-rainier-maryland-01.JPG",
    alt: "Interior railing in Mount Rainier, MD - overview",

    description:
      "Custom interior railing fabricated and installed for a residential property in Mount Rainier. Built for durability and code compliance while maintaining a clean, modern look.",
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
       // Optional SEO fields (safe to add now)
        summary: "Custom interior stair railing fabricated and installed in Mount Rainier, MD—clean modern lines, code-compliant, and built to last.",
        seoTitle: "Custom Interior Metal Railing in Mount Rainier, MD",
        metaDescription: "Modern interior metal stair railing installed in Mount Rainier, Maryland near DC. Custom steel fabrication, code-compliant install, and a clean durable finish. Request pricing.",
    
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
