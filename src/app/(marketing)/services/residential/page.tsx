import { ServicePage } from "@/components/ServicePage";

export default function ResidentialServicesPage() {
  return (
    <ServicePage
      service={{
        key: "residential",
        title: "Residential Ironwork",
        subtitle:
          "Custom metalwork for homes—built for safety, curb appeal, and long-term durability.",
        heroImageSrc:
          "/images/residential-metal-rail1-2000.webp", // ✅ use the same image as your Home Services section
        heroImageAlt: "Residential ironwork and metal fabrication services",
        heroPosition: "object-[30%_60%]",
        description:
        "We design, fabricate, and install custom residential ironwork for homeowners seeking durable, well-crafted metal features that enhance both safety and appearance. Our residential services include railings, stairs, gates, fences, balconies, and other custom metal elements tailored to the home’s layout and style.\n\nEach project begins with careful measurement and planning to ensure proper fit, code compliance, and a clean finished look. Whether working on exterior railings, entry gates, or interior stair systems, we focus on craftsmanship, material quality, and long-term durability. Our team works directly with homeowners and builders to deliver residential metalwork that blends seamlessly with the property while providing dependable performance for everyday use.",

        exampleWork: [
          "Interior stair railings",
          "Exterior railings (porches, steps, balconies)",
          "Driveway and pedestrian gates",
          "Window guards and security doors",
          "Handrails and guardrails",
          "Custom decorative iron details",
        ],

        credentials: {
  title: "Credentials & Certifications",
  description:
    "Licensed and insured residential metal fabrication and installation. All work is performed in accordance with local building codes and state requirements.",

  contractors: [
    {
      src: "/certs/mhic.webp",
      alt: "Maryland Home Improvement Commission (MHIC) License",
    },
  ],
},


        matchesProject: (p) =>
          (p.workType || "").toLowerCase() === "residential",
      }}
    />
  );
}
