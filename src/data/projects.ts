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
  | "Structural Steel"
  | "Canopies"
  | "Decks"
  | "Exterior Staircases"
  | "Custom Furniture"
  | "Security Cages"
  | "Utility Enclosures"
  | "Cable Railings";

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
  name: "Reston Commercial Security Gate and Handrail",
  location: "Reston, VA",
  workType: "Commercial",
  productTypes: ["Gates", "Exterior Railings"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/commercial-security-gate-steel-mesh-reston-virginia-thumb.webp",
  alt: "Commercial steel mesh security gate and exterior handrail installation in Reston, VA - overview",

  description:
    "Commercial steel fabrication project completed in Reston, Virginia featuring a custom steel mesh security gate and an exterior steel handrail. Built for secure access control and a clean professional finish suitable for a high-traffic commercial environment.",
  year: 2025,

  images: [
    {
      src:"/images/work/commercial-security-gate-steel-mesh-reston-virginia-thumb.webp",
      alt: "Commercial steel mesh security gate and exterior handrail installation in Reston, VA - overview",

    },
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
  id: 2,
  slug: "commercial-steel-canopy-frame-glen-burnie-maryland",
  name: "Owings Mill Middle School Steel Canopy Frame",
  location: "Glen Burnie, MD",
  workType: "Commercial",
  productTypes: ["Structural Steel", "Canopies"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-thumb.jpg",
  alt: "Commercial steel canopy frame installation at Owings Mill Middle School in Glen Burnie, Maryland",

  description:
    "Commercial structural steel project completed for Owings Mill Middle School in Glen Burnie, Maryland. The work included shop fabrication and field installation of a custom structural steel canopy frame supporting a covered exterior entry. The assembly was designed to satisfy structural load demands and integrate cleanly with the building’s canopy system.",
  year: 2024,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-thumb.jpg",
      alt: "Steel canopy frame at Owings Mill Middle School - completed overview",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-01.jpg",
      alt: "Commercial steel canopy frame installation at middle school in Glen Burnie, MD",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-02.jpg",
      alt: "Structural steel canopy frame - column and beam connection detail",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-03.jpg",
      alt: "Steel canopy support frame - anchored post and base plate detail",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-04.jpg",
      alt: "Custom fabricated steel canopy frame - side elevation view",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-05.jpg",
      alt: "Commercial steel canopy structure - framing alignment and welds",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-06.jpg",
      alt: "Exterior steel canopy frame at school entrance - structural detail",
    },
    {
      src: "/images/work/commercial-steel-canopy-frame-glen-burnie-maryland-07.jpg",
      alt: "Finished steel canopy frame ready for architectural canopy panels",
    },
  ],

  // Optional SEO fields
  summary:
    "Commercial steel canopy frame fabricated and installed at Owings Mill Middle School in Glen Burnie, MD. Designed for structural strength, durability, and long-term exterior use.",
  seoTitle:
    "Steel Canopy Frame at Owings Mill Middle School | Glen Burnie, MD",
  metaDescription:
    "Custom commercial steel canopy frame fabricated and installed at Owings Mill Middle School in Glen Burnie, Maryland. Structural steel built for durability, safety, and architectural integration by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Structural steel" },
    { label: "Finish", value: "Shop-fabricated / field-installed (paint or coating per spec)" },
    { label: "Use", value: "Commercial / educational facility canopy support" },
    { label: "Code", value: "Installed to local and project-specific structural requirements" },
  ],
},

  {
  id: 3,
  slug: "residential-modern-interior-metal-railing-arlington-virginia",
  name: "Arlington Interior Metal Railing",
  location: "Arlington, VA",
  workType: "Residential",
  productTypes: ["Interior Railings"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-modern-interior-metal-railing-arlington-virginia-thumb.jpg",
  alt: "Modern interior metal railing installation in Arlington, Virginia - residential stair railing overview",

  description:
    "Residential interior metal railing project completed in Arlington, Virginia featuring a clean, modern design tailored to a contemporary home interior. This custom-fabricated railing provides fall protection while maintaining open sightlines and a minimalist architectural aesthetic.",
  year: 2018,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-modern-interior-metal-railing-arlington-virginia-thumb.jpg",
      alt: "Modern interior metal stair railing in Arlington, VA - completed overview",
    },
    {
      src: "/images/work/residential-modern-interior-metal-railing-arlington-virginia-01.jpg",
      alt: "Residential modern metal stair railing - full run view",
    },
    {
      src: "/images/work/residential-modern-interior-metal-railing-arlington-virginia-02.jpg",
      alt: "Interior metal railing - post and handrail connection detail",
    },
    {
      src: "/images/work/residential-modern-interior-metal-railing-arlington-virginia-03.jpg",
      alt: "Modern interior railing system - clean lines and minimalist design",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom modern interior metal railing installed in Arlington, VA. Designed for safety, durability, and a clean contemporary look.",
  seoTitle:
    "Modern Interior Metal Railing in Arlington, VA | Paradise Ironworks",
  metaDescription:
    "Residential modern interior metal stair railing fabricated and installed in Arlington, Virginia. Clean lines, custom fit, and built for long-term durability by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Painted / powder-coated (interior grade)" },
    { label: "Use", value: "Residential / interior stair safety" },
    { label: "Code", value: "Installed to local residential building code" },
  ],
},
{
  id: 4,
  slug: "structural-steel-frame-install-washington-dc",
  name: "Structural Steel Frame Installation",
  location: "Washington, DC",
  workType: "Structural",
  productTypes: ["Structural Steel"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/structural-steel-frame-install-washington-dc-thumb.JPG",
  alt: "Structural steel frame installation in Washington, DC - commercial steel framing overview",

  description:
    "Commercial structural steel project completed in Washington, DC featuring the installation of a custom steel frame assembly. Built to provide dependable structural support and long-term durability, with field installation executed for alignment, stability, and integration with the surrounding build.",
  year: 2019,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/structural-steel-frame-install-washington-dc-thumb.JPG",
      alt: "Structural steel frame installation in Washington, DC - completed overview",
    },
    {
      src: "/images/work/structural-steel-frame-install-washington-dc-01.JPG",
      alt: "Structural steel framing installation - wide view of steel members and layout",
    },
    {
      src: "/images/work/structural-steel-frame-install-washington-dc-02.JPG",
      alt: "Steel frame install - connection points and structural alignment detail",
    },
    {
      src: "/images/work/structural-steel-frame-install-washington-dc-03.JPG",
      alt: "Commercial steel frame installation - column and beam intersection detail",
    },
    {
      src: "/images/work/structural-steel-frame-install-washington-dc-04.JPG",
      alt: "Installed structural steel frame - on-site view showing fit and placement",
    },
  ],

  // Optional SEO fields
  summary:
    "Structural steel frame installation in Washington, DC for a commercial build. Custom fabricated and installed for strength, stability, and long-term performance.",
  seoTitle:
    "Structural Steel Frame Installation in Washington, DC | Paradise Ironworks",
  metaDescription:
    "Commercial structural steel frame fabricated and installed in Washington, DC. Built for strength, stability, and long-term durability. Contact Paradise Ironworks for structural steel fabrication and installation.",

  specifications: [
    { label: "Material", value: "Structural steel" },
    { label: "Finish", value: "Shop-fabricated / field-installed (per project spec)" },
    { label: "Use", value: "Commercial / structural support framing" },
    { label: "Code", value: "Installed to local and project-specific structural requirements" },
  ],
},

 {
  id: 5,
  slug: "residential-exterior-metal-hand-railing-annapolis-maryland",
  name: "Exterior Metal Hand Railing",
  location: "Annapolis, MD",
  workType: "Residential",
  productTypes: ["Exterior Railings"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-exterior-metal-hand-railing-annapolis-maryland-thumb.jpg",
  alt: "Residential exterior metal hand railing installation in Annapolis, Maryland",

  description:
    "Residential exterior metal hand railing project completed in Annapolis, Maryland. This custom-fabricated steel railing was designed to provide safe, code-compliant support for exterior steps while maintaining a clean, understated appearance suited to the home’s exterior.",
  year: 2024,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-exterior-metal-hand-railing-annapolis-maryland-thumb.jpg",
      alt: "Exterior metal hand railing in Annapolis, MD - completed overview",
    },
    {
      src: "/images/work/residential-exterior-metal-hand-railing-annapolis-maryland-01.jpg",
      alt: "Residential exterior metal hand railing - full view of stair run",
    },
    {
      src: "/images/work/residential-exterior-metal-hand-railing-annapolis-maryland-02.jpg",
      alt: "Custom steel exterior hand railing - post and mounting detail",
    },
    {
      src: "/images/work/residential-exterior-metal-hand-railing-annapolis-maryland-03.jpg",
      alt: "Exterior metal hand rail installation - clean lines and finished appearance",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom exterior metal hand railing installed at a residential property in Annapolis, MD. Built for safety, durability, and long-term outdoor performance.",
  seoTitle:
    "Exterior Metal Hand Railing in Annapolis, MD | Paradise Ironworks",
  metaDescription:
    "Residential exterior metal hand railing fabricated and installed in Annapolis, Maryland. Custom steel railing built for safety, durability, and code compliance by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Exterior-grade paint or protective coating" },
    { label: "Use", value: "Residential / exterior stair safety" },
    { label: "Code", value: "Installed to local residential building code requirements" },
  ],
},
{
  id: 6,
  slug: "residential-metal-exterior-staircase-deck-ne-washington-dc",
  name: "Exterior Metal Staircase and Deck",
  location: "Washington, DC (NE)",
  workType: "Residential",
  productTypes: ["Exterior Staircases", "Decks"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-metal-exterior-staircase-deck-ne-washington-dc-thumb.jpg",
  alt: "Residential exterior metal staircase and deck installation in Northeast Washington, DC",

  description:
    "Residential exterior metal staircase and deck project completed in Northeast Washington, DC. This custom-fabricated steel staircase provides safe exterior access between levels and integrates with a metal deck structure designed for durability, weather resistance, and everyday residential use.",
  year: 2025,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-metal-exterior-staircase-deck-ne-washington-dc-thumb.jpg",
      alt: "Exterior metal staircase and deck in NE Washington, DC - completed overview",
    },
    {
      src: "/images/work/residential-metal-exterior-staircase-deck-ne-washington-dc-01.jpg",
      alt: "Residential exterior metal staircase - full view showing stair run and landing",
    },
    {
      src: "/images/work/residential-metal-exterior-staircase-deck-ne-washington-dc-02.jpg",
      alt: "Metal exterior staircase and deck - side elevation showing structure and supports",
    },
    {
      src: "/images/work/residential-metal-exterior-staircase-deck-ne-washington-dc-03.jpg",
      alt: "Custom steel exterior stairs and deck - framing and connection detail",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom exterior metal staircase and deck fabricated and installed in NE Washington, DC. Built for safe access, structural strength, and long-term outdoor durability.",
  seoTitle:
    "Exterior Metal Staircase and Deck in NE Washington, DC | Paradise Ironworks",
  metaDescription:
    "Residential exterior metal staircase and deck fabricated and installed in Northeast Washington, DC. Custom steel construction built for safe access, durability, and weather resistance by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Exterior-grade paint or protective coating" },
    { label: "Use", value: "Residential / exterior access and outdoor living" },
    { label: "Structure", value: "Exterior staircase with integrated deck framing" },
  ],
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
    year: 2019,
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
      { label: "Use", value: "Residential / interior stair safety" },
      { label: "Code", value: "Installed to local code requirements" },
    ],
  },
  {
  id: 8,
  slug: "structural-steel-framing-training-facility-beltsville-maryland",
  name: "Structural Steel Framing for Training Facility",
  location: "Beltsville, MD",
  workType: "Structural",
  productTypes: ["Structural Steel"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-thumb.jpeg",
  alt: "Structural steel framing installation for a training facility in Beltsville, Maryland",

  description:
    "Structural steel framing project completed for a training facility in Beltsville, Maryland. This scope included fabrication and installation support for structural members and framing assemblies, focusing on accurate fit-up, clean welds, and jobsite-ready execution for commercial-grade performance.",
  year: 2023,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-thumb.jpeg",
      alt: "Structural steel framing in Beltsville, MD - completed overview",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-01.jpeg",
      alt: "Structural steel framing installation - overall view of members and layout",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-02.jpeg",
      alt: "Steel framing - erected members and connections in progress",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-03.jpeg",
      alt: "Structural steel framing - connection detail and alignment",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-04.jpeg",
      alt: "Steel framing - welded connection and fit-up detail",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-05.jpeg",
      alt: "Structural steel members - installed framing section view",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-06.jpeg",
      alt: "Structural steel framing - interior framing progress view",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-07.jpeg",
      alt: "Steel framing installation - bracing and member layout detail",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-08.jpeg",
      alt: "Structural framing - installed steel members and connections",
    },
    {
      src: "/images/work/structural-steel-framing-training-facility-beltsville-maryland-09.jpeg",
      alt: "Structural steel framing - final progress overview of the installed assembly",
    },
  ],

  // Optional SEO fields
  summary:
    "Structural steel framing installed for a training facility in Beltsville, MD—commercial-grade steel work focused on fit-up, alignment, and durable performance.",
  seoTitle:
    "Structural Steel Framing in Beltsville, MD | Paradise Ironworks",
  metaDescription:
    "Structural steel framing project for a training facility in Beltsville, Maryland. Fabrication and installation support for commercial structural members and framing assemblies by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Structural steel" },
    { label: "Finish", value: "Jobsite-ready steel (finish per project specs)" },
    { label: "Use", value: "Commercial / training facility structural framing" },
    { label: "Code", value: "Installed to applicable structural and local code requirements" },
  ],
},
{
  id: 9,
  slug: "residential-exterior-patio-fencing-brentwood-maryland",
  name: "Exterior Patio Fencing",
  location: "Brentwood, MD",
  workType: "Residential",
  productTypes: ["Fencing"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-thumb.jpeg",
  alt: "Residential exterior patio fencing installation in Brentwood, Maryland",

  description:
    "Residential exterior patio fencing project completed in Brentwood, Maryland. This custom metal fence was fabricated and installed to define the patio space, improve safety, and complement the surrounding exterior while maintaining durability for long-term outdoor use.",
  year: 2019,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-thumb.jpeg",
      alt: "Exterior patio fencing in Brentwood, MD - completed overview",
    },
    {
      src: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-01.jpeg",
      alt: "Residential exterior patio fencing - full fence run overview",
    },
    {
      src: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-02.jpeg",
      alt: "Custom metal patio fence - post spacing and panel detail",
    },
    {
      src: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-03.jpeg",
      alt: "Exterior patio fencing installation - corner and alignment detail",
    },
    {
      src: "/images/work/residential-exterior-patio-fencing-brentwood-maryland-04.jpeg",
      alt: "Residential metal patio fence - finished appearance and integration with patio",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom exterior patio fencing installed at a residential property in Brentwood, MD. Designed for safety, durability, and clean outdoor aesthetics.",
  seoTitle:
    "Exterior Patio Fencing in Brentwood, MD | Paradise Ironworks",
  metaDescription:
    "Residential exterior patio fencing fabricated and installed in Brentwood, Maryland. Custom metal fencing built for durability, safety, and outdoor performance by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Exterior-grade paint or protective coating" },
    { label: "Use", value: "Residential / patio enclosure and safety fencing" },
    { label: "Code", value: "Installed to local residential building code requirements" },
  ],
},
{
  id: 10,
  slug: "residential-interior-ornate-metal-railing-baltimore-maryland",
  name: "Interior Ornate Metal Railing",
  location: "Baltimore, MD",
  workType: "Residential",
  productTypes: ["Interior Railings"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-thumb.jpeg",
  alt: "Residential interior ornate metal railing installation in Baltimore, Maryland",

  description:
    "Residential interior ornate metal railing project completed in Baltimore, Maryland. This custom-fabricated railing features decorative metalwork designed to enhance the interior staircase while providing durable, code-compliant safety for daily residential use.",
  year: 2018,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-thumb.jpeg",
      alt: "Interior ornate metal railing in Baltimore, MD - completed overview",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-01.jpeg",
      alt: "Ornate interior metal railing - full stair run overview",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-02.jpeg",
      alt: "Decorative interior metal railing - scroll and baluster detail",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-03.jpeg",
      alt: "Interior ornate railing - handrail profile and finish detail",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-04.jpeg",
      alt: "Custom interior metal railing - decorative panel section",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-05.jpeg",
      alt: "Ornamental metal railing - stair landing transition detail",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-06.jpeg",
      alt: "Interior metal railing installation - post and mounting detail",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-07.jpeg",
      alt: "Decorative wrought-style interior railing - finished appearance",
    },
    {
      src: "/images/work/residential-interior-ornate-metal-railing-baltimore-maryland-08.jpeg",
      alt: "Interior ornate metal railing - overall staircase integration",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom interior ornate metal railing installed in a Baltimore, MD residence. Decorative steelwork designed for safety, durability, and refined interior aesthetics.",
  seoTitle:
    "Interior Ornate Metal Railing in Baltimore, MD | Paradise Ironworks",
  metaDescription:
    "Residential interior ornate metal railing fabricated and installed in Baltimore, Maryland. Custom decorative steel railing built for safety and visual impact by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Interior-grade paint or specialty finish" },
    { label: "Use", value: "Residential / interior stair safety" },
    { label: "Code", value: "Installed to local residential building code requirements" },
  ],
},
{
  id: 11,
  slug: "residential-motorized-iron-driveway-gate-columbia-maryland",
  name: "Motorized Iron Driveway Gate",
  location: "Columbia, MD",
  workType: "Residential",
  productTypes: ["Gates"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/residential-motorized-iron-driveway-gate-columbia-maryland-thumb.JPG",
  alt: "Residential motorized iron driveway gate installation in Columbia, Maryland",

  description:
    "Residential motorized iron driveway gate project completed in Columbia, Maryland. This custom-fabricated gate was built to improve security and curb appeal while providing smooth, reliable automated access for daily use.",
  year: 2015,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/residential-motorized-iron-driveway-gate-columbia-maryland-thumb.JPG",
      alt: "Motorized iron driveway gate in Columbia, MD - completed overview",
    },
    {
      src: "/images/work/residential-motorized-iron-driveway-gate-columbia-maryland-01.JPG",
      alt: "Residential motorized driveway gate - front view of gate and entry",
    },
    {
      src: "/images/work/residential-motorized-iron-driveway-gate-columbia-maryland-02.JPG",
      alt: "Custom iron driveway gate - gate leaf alignment and frame detail",
    },
    {
      src: "/images/work/residential-motorized-iron-driveway-gate-columbia-maryland-03.JPG",
      alt: "Automated driveway gate installation - finished appearance and approach view",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom motorized iron driveway gate installed at a home in Columbia, MD—built for security, curb appeal, and reliable automated access.",
  seoTitle:
    "Motorized Iron Driveway Gate in Columbia, MD | Paradise Ironworks",
  metaDescription:
    "Residential motorized iron driveway gate fabricated and installed in Columbia, Maryland. Custom steel gate built for security, durability, and smooth automated operation by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel / iron" },
    { label: "Finish", value: "Exterior-grade paint or protective coating" },
    { label: "Use", value: "Residential / driveway security and controlled access" },
    { label: "Automation", value: "Motorized operation (operator system per project specs)" },
  ],
},
{
  id: 12,
  slug: "structural-steel-facility-build-langdon-washington-dc",
  name: "Structural Steel Facility Build",
  location: "Washington, DC",
  workType: "Structural",
  productTypes: ["Structural Steel"],

  // IMPORTANT: this thumbnail must exist under /public
  image: "/images/work/structural-steel-facility-build-langdon-washington-dc-thumb.jpeg",
  alt: "Structural steel facility build installation in the Langdon neighborhood of Washington, DC",

  description:
    "Structural steel facility build completed in the Langdon area of Washington, DC. This project involved installation support for structural steel members and assemblies as part of a larger commercial facility build, with attention to alignment, fit-up, and jobsite coordination.",
  year: 2023,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-thumb.jpeg",
      alt: "Structural steel facility build in Washington, DC - completed overview",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-01.jpeg",
      alt: "Structural steel facility build - overall framing and erection view",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-02.jpeg",
      alt: "Steel facility build - erected members and connection layout",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-03.jpeg",
      alt: "Structural steel framing - column and beam connection detail",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-04.jpeg",
      alt: "Steel facility build - welded connections and fit-up detail",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-05.jpeg",
      alt: "Structural steel installation - interior framing progress view",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-06.jpeg",
      alt: "Steel facility framing - bracing and member alignment",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-07.jpeg",
      alt: "Structural steel erection - mid-build progress overview",
    },
    {
      src: "/images/work/structural-steel-facility-build-langdon-washington-dc-08.jpeg",
      alt: "Structural steel facility build - installed members and final progress view",
    },
  ],

  // Optional SEO fields
  summary:
    "Structural steel facility build completed in Washington, DC. Commercial-grade steel installation focused on accuracy, coordination, and long-term structural performance.",
  seoTitle:
    "Structural Steel Facility Build in Washington, DC | Paradise Ironworks",
  metaDescription:
    "Structural steel facility build in Washington, DC featuring installation support for commercial structural steel framing and assemblies by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Structural steel" },
    { label: "Finish", value: "Jobsite-ready steel (finish per project specifications)" },
    { label: "Use", value: "Commercial / facility structural framing" },
    { label: "Code", value: "Installed to applicable structural and local building code requirements" },
  ],
},
{
  id: 13,
  slug: "residential-custom-steel-dining-room-table-frame-prince-frederick-maryland",
  name: "Custom Steel Dining Room Table Frame",
  location: "Prince Frederick, MD",
  workType: "Residential",
  productTypes: ["Custom Furniture"],

  // IMPORTANT: this thumbnail must exist under /public/images/work
  image:
    "/images/work/residential-custom-steel-dining-room-table-frame-prince-frederick-maryland-thumb.JPG",
  alt:
    "Custom steel dining room table frame fabricated for a residential home in Prince Frederick, Maryland",

  description:
    "Residential custom steel dining room table frame project completed in Prince Frederick, Maryland. This bespoke steel base was fabricated to support a solid dining tabletop, combining clean modern lines with structural strength and long-term durability for everyday residential use.",
  year: 2016,

  images: [
    // ✅ Repeat thumbnail on the project detail page 
    {
      src:
        "/images/work/residential-custom-steel-dining-room-table-frame-prince-frederick-maryland-thumb.JPG",
      alt:
        "Custom steel dining room table frame in Prince Frederick, MD - completed overview",
    },
    {
      src:
        "/images/work/residential-custom-steel-dining-room-table-frame-prince-frederick-maryland-01.JPG",
      alt:
        "Custom steel dining table frame - full base view showing proportions and finish",
    },
    {
      src:
        "/images/work/residential-custom-steel-dining-room-table-frame-prince-frederick-maryland-02.JPG",
      alt:
        "Steel dining table base - welded joints and structural detail",
    },
    {
      src:
        "/images/work/residential-custom-steel-dining-room-table-frame-prince-frederick-maryland-03.JPG",
      alt:
        "Custom residential steel table frame - installed and ready for tabletop",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom steel dining room table frame fabricated for a residential home in Prince Frederick, MD. Designed for strength, clean aesthetics, and long-term everyday use.",
  seoTitle:
    "Custom Steel Dining Room Table Frame in Prince Frederick, MD | Paradise Ironworks",
  metaDescription:
    "Residential custom steel dining room table frame fabricated in Prince Frederick, Maryland. Precision-built steel base designed for durability, stability, and modern interior design by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Interior-grade paint or specialty coating" },
    { label: "Use", value: "Residential / custom furniture base" },
    { label: "Design", value: "Custom-fabricated steel table frame" },
  ],
},
{
  id: 14,
  slug: "commercial-steel-utility-cage-waldorf-maryland",
  name: "Commercial Steel Utility Cage",
  location: "Waldorf, MD",
  workType: "Commercial",
  productTypes: ["Security Cages", "Utility Enclosures"],

  // IMPORTANT: this thumbnail must exist under /public/images/work
  image:
    "/images/work/commercial-steel-utility-cage-waldorf-maryland-thumb.jpg",
  alt:
    "Commercial steel utility cage installation in Waldorf, Maryland",

  description:
    "Commercial steel utility cage project completed in Waldorf, Maryland. This custom-fabricated steel enclosure was designed to secure utilities and equipment, providing controlled access, durability, and long-term protection in a commercial environment.",
  year: 2018,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src:
        "/images/work/commercial-steel-utility-cage-waldorf-maryland-thumb.jpg",
      alt:
        "Commercial steel utility cage in Waldorf, MD - completed overview",
    },
    {
      src:
        "/images/work/commercial-steel-utility-cage-waldorf-maryland-01.jpg",
      alt:
        "Steel utility cage - full enclosure view showing layout and access points",
    },
    {
      src:
        "/images/work/commercial-steel-utility-cage-waldorf-maryland-02.jpg",
      alt:
        "Commercial utility cage - mesh panels and framing detail",
    },
    {
      src:
        "/images/work/commercial-steel-utility-cage-waldorf-maryland-03.JPG",
      alt:
        "Custom steel utility enclosure - installed and secured in commercial setting",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom steel utility cage fabricated and installed for a commercial property in Waldorf, MD. Built to secure equipment and utilities with durable steel construction.",
  seoTitle:
    "Commercial Steel Utility Cage in Waldorf, MD | Paradise Ironworks",
  metaDescription:
    "Commercial steel utility cage fabricated and installed in Waldorf, Maryland. Custom steel enclosure designed for security, durability, and controlled access by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Steel" },
    { label: "Finish", value: "Exterior-grade paint or protective coating" },
    { label: "Use", value: "Commercial / utility and equipment security" },
    { label: "Design", value: "Custom-fabricated steel cage enclosure" },
  ],
},
{
  id: 15,
  slug: "commercial-condominium-aluminum-cable-fencing-washington-dc",
  name: "Commercial Condominium Aluminum Cable Fencing",
  location: "Washington, DC",
  workType: "Commercial",
  productTypes: ["Cable Railings", "Fencing"],

  // IMPORTANT: this thumbnail must exist under /public/images/work
  image:
    "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-thumb.jpeg",
  alt:
    "Commercial condominium aluminum cable fencing installation in Washington, DC",

  description:
    "Commercial aluminum cable fencing project completed for a condominium property in Washington, DC. This custom-fabricated aluminum fence system with cable infill was designed to provide a clean, modern look while maintaining security, durability, and long-term performance in a commercial setting.",
  year: 2025,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src:
        "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-thumb.jpeg",
      alt:
        "Aluminum cable fencing in Washington, DC - completed overview",
    },
    {
      src:
        "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-01.jpeg",
      alt:
        "Commercial cable fence - wide view showing overall run and site context",
    },
    {
      src:
        "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-02.jpeg",
      alt:
        "Aluminum posts and cable infill - alignment and spacing detail",
    },
    {
      src:
        "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-03.jpeg",
      alt:
        "Cable fencing corner/transition detail - posts, fittings, and cable terminations",
    },
    {
      src:
        "/images/work/commercial-condominium-aluminum-cable-fencing-washington-dc-04.jpeg",
      alt:
        "Completed aluminum cable fencing - clean lines and finished installation detail",
    },
  ],

  // Optional SEO fields
  summary:
    "Aluminum cable fencing fabricated and installed for a condominium property in Washington, DC. Modern, durable fence system with cable infill.",
  seoTitle:
    "Aluminum Cable Fencing for Condominium in Washington, DC | Paradise Ironworks",
  metaDescription:
    "Commercial aluminum cable fencing fabricated and installed for a condominium property in Washington, DC. Custom aluminum posts with cable infill for a modern, durable fence system by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Aluminum" },
    { label: "Infill", value: "Cable (stainless steel)" },
    { label: "Use", value: "Commercial / condominium fencing" },
    { label: "Design", value: "Custom-fabricated aluminum fence with cable infill" },
  ],
},
{
  id: 16,
  slug: "interior-metal-railing-north-potomac-maryland",
  name: "Interior Metal Railing",
  location: "North Potomac, Maryland",
  workType: "Residential",
  productTypes: ["Interior Railings"],

  // IMPORTANT: this thumbnail must exist under /public/images/work
  image:
    "/images/work/interior-metal-railing-north-potomac-maryland-thumb.JPG",
  alt:
    "Interior metal railing installation in North Potomac, Maryland",

  description:
    "Custom interior metal railing project completed for a residential property in North Potomac, Maryland. This fabricated railing system was designed to complement the interior space while providing needed stairway safety.",
  year: 2026,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-thumb.JPG",
      alt:
        "Interior metal railing in North Potomac, Maryland - completed overview",
    },
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-01.JPG",
      alt:
        "Interior metal railing - wide view of completed installation",
    },
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-02.JPG",
      alt:
        "Interior railing detail - custom metal balusters and handrail",
    },
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-03.JPG",
      alt:
        "Residential interior metal railing - angle view showing profile and finish",
    },
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-04.JPG",
      alt:
        "Completed interior railing installation - stair and landing detail",
    },
    {
      src:
        "/images/work/interior-metal-railing-north-potomac-maryland-05.JPG",
      alt:
        "Interior metal railing - finished installation close-up",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom interior metal railing fabricated and installed for a residential property in North Potomac, Maryland.",
  seoTitle:
    "Interior Metal Railing in North Potomac, Maryland | Paradise Ironworks",
  metaDescription:
    "Custom interior metal railing fabricated and installed for a residential property in North Potomac, Maryland. Clean, durable, and professionally finished interior ironwork by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Metal" },
    { label: "Use", value: "Residential interior railing" },
    { label: "Location", value: "North Potomac, Maryland" },
    { label: "Design", value: "Custom-fabricated interior metal railing" },
  ],
},
{
  id: 17,
  slug: "residential-metal-stair-case-washington-dc",
  name: "Residential Metal Stair Case",
  location: "Washington, DC",
  workType: "Residential",
  productTypes: ["Exterior Staircases"],

  // IMPORTANT: this thumbnail must exist under /public/images/work
  image:
    "/images/work/residential-metal-stair-case-washington-dc-thumb.jpg",
  alt:
    "Residential metal staircase project in Washington, DC",

  description:
    "Custom residential metal staircase project completed for a property in Washington, DC. This fabricated metal stair system was built to provide safe, durable access while fitting the style and layout of the home.",
  year: 2026,

  images: [
    // ✅ Repeat thumbnail on the project detail page
    {
      src:
        "/images/work/residential-metal-stair-case-washington-dc-thumb.jpg",
      alt:
        "Residential metal staircase in Washington, DC - completed overview",
    },
    {
      src:
        "/images/work/residential-metal-stair-case-washington-dc-01.jpg",
      alt:
        "Residential metal staircase - completed installation overview",
    },
    {
      src:
        "/images/work/residential-metal-stair-case-washington-dc-02.jpg",
      alt:
        "Custom residential metal staircase - angle view of finished installation",
    },
    {
      src:
        "/images/work/residential-metal-stair-case-washington-dc-03.jpg",
      alt:
        "Metal staircase detail - residential fabrication and finish",
    },
    {
      src:
        "/images/work/residential-metal-stair-case-washington-dc-04.jpg",
      alt:
        "Completed residential metal staircase - side view showing structure and railing",
    },
  ],

  // Optional SEO fields
  summary:
    "Custom residential metal staircase fabricated and installed for a property in Washington, DC.",
  seoTitle:
    "Residential Metal Staircase in Washington, DC | Paradise Ironworks",
  metaDescription:
    "Custom residential metal staircase fabricated and installed for a property in Washington, DC. Durable, cleanly finished metalwork designed for residential use by Paradise Ironworks.",

  specifications: [
    { label: "Material", value: "Metal" },
    { label: "Use", value: "Residential staircase" },
    { label: "Location", value: "Washington, DC" },
    { label: "Design", value: "Custom-fabricated metal staircase" },
  ],
},



];

export function getProjectBySlug(slug: string) {
  const needle = normalizeSlug(slug);
  return projects.find((p) => normalizeSlug(p.slug) === needle);
}
