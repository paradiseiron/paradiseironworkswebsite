// src/app/services/commercial/page.tsx
import { ServicePage } from "@/components/ServicePage";

export default function CommercialServicesPage() {
  return (
    <ServicePage
      service={{
        key: "commercial",
        title: "Commercial Metalwork",
        subtitle:
          "Durable, code-conscious steel and ironwork for businesses, schools, and multi-unit properties.",
        heroImageSrc: "/images/commercial.jpg",
        heroImageAlt: "Commercial metal fabrication and installation services",
        heroPosition: "object-[50%_20%]",

        description:
          "We support commercial projects with fabricated steel and ironwork built for high-traffic environments. Our team handles fabrication and installation for properties where durability, safety, and clean execution matter.\n\nWe regularly work with property managers, general contractors, schools, and multi-unit facilities on projects that require code-compliant railings, secure access points, and custom metal solutions. Each project is measured, fabricated, and installed to meet project specifications, timelines, and long-term performance requirements.",

        exampleWork: [
          "Security gates and access control assemblies",
          "Commercial railings and stair handrails",
          "Dumpster enclosures and protective barriers",
          "Canopies and awnings (steel framing)",
          "Equipment guards and protective steel",
          "Custom metal fabrication for property upgrades",
        ],

        // ✅ NEW: Credentials section placeholder content
        credentials: {
          title: "Credentials & Certifications",
          description:
            "Rest assured we're registred with Maryland Deparntment of Transportation (MDOT) as well as Washington Metro Area Transit Authority (WMATA) as a Small Business Enterprise (SBE) under the following North American Industry Classification System (NAICS) Code(s):",
          naicsCodes: [
            "236220 - Commercial and Institutional Building Construction",
            "237990 - Other Heavy and Civil Engineering Construction",
            "238120 - Structural Steel and Precast Concrete Contractors",
            "238190 - Other Foundation, Structure, and Building Exterior Contractors",
            "332312 - Fabricated Structural Metal Manufacturing",
            "332313 - Plate Work Manufacturing",
            "332321 - Metal Window and Door Manufacturing",
            "332323 - Ornamental and Architectural Metal Work Manufacturing",
            "423390 - Other Construction Material Merchant Wholesalers",
            "423510 - Metal Service Centers and Other Metal Merchant Wholesalers",
          ],
          // NOTE: These are placeholder logo paths. Add files under /public/images/logos/
          // (SVG preferred) or replace with your actual logo filenames.
          contractors: [
            {
              src: "/images/logos/Gilbane.png",
              alt: "Major contractor logo placeholder 1",
            },
            {
              src: "/images/logos/clark-construction.png",
              alt: "Major contractor logo placeholder 2",
            },
            {
              src: "/images/logos/hensel-phelps.jpg",
              alt: "Major contractor logo placeholder 3",
            },
            {
              src: "/images/logos/whiting-turner.webp",
              alt: "Major contractor logo placeholder 4",
            },
            {
              src: "/images/logos/hitt.png",
              alt: "Major contractor logo placeholder 5",
            },
           
          ],
          owners: [
    {
      src: "/images/logos/washington-metro-wmata-logo.png",
      alt: "Washington Metro Area Transit Authority",
    },
    {
      src: "/images/logos/NIH.png",
      alt: "National Institutes of Health",
    },
    {
      src: "/images/logos/MTA-Purple-Line.png",
      alt: "University System of Maryland",
    },
  ],
        },

        matchesProject: (p) =>
          (p.workType || "").toLowerCase() === "commercial",
      }}
    />
  );
}
