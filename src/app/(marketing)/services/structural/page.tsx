import { ServicePage } from "@/components/ServicePage";

export default function StructuralServicesPage() {
  return (
    <ServicePage
      service={{
        key: "structural",
        title: "Structural Steel",
        subtitle:
          "Steel framing, supports, and structural fabrication for builds and renovations.",
        heroImageSrc:
          "/images/structural-steel-install-2000.webp", 
        heroImageAlt: "Structural steel fabrication and installation services",
        heroPosition: "object-[50%_20%]",
        description:
        "We provide structural steel fabrication and installation services for commercial builds, renovations, and specialty construction projects. Our work includes steel framing, beams, columns, supports, and custom structural assemblies designed to integrate cleanly with architectural and engineering requirements.\n\nWe regularly coordinate with general contractors, engineers, and project managers to ensure proper fit-up, alignment, and sequencing on active job sites. From small structural modifications to full facility builds, each component is fabricated and installed with accuracy, safety, and long-term performance in mind. Our team understands the demands of structural work, including tolerances, load considerations, and jobsite coordination, allowing us to deliver reliable steel solutions that support the success of the overall build.",

        exampleWork: [
          "Structural steel frames and supports",
          "Beams, columns, and connection assemblies",
          "Canopy frame fabrication and installation",
          "Steel stair stringers and structural stair components",
          "Equipment supports and structural platforms",
          "Custom structural fabrication for renovations",
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
          (p.workType || "").toLowerCase() === "structural",
      }}
    />
  );
}
