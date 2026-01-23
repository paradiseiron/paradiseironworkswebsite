"use client";

import Image from "next/image";

interface FeatureCardProps {
  iconSrc: string; // ✅ allow different icons per card
  title: string;
  description: string;
}

function FeatureCard({ iconSrc, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-[#fef3c6] rounded-full size-16 flex items-center justify-center mb-5">
        <Image
          src={iconSrc}
          alt=""
          width={32}
          height={32}
          className="object-contain"
        />
      </div>

      <h3 className="font-inter text-[#0a0a0a] text-[24px] leading-[32px] tracking-[0.0703px] font-medium mb-3">
        {title}
      </h3>

      <p className="font-inter text-[#52525c] text-[16px] leading-[24px] tracking-[-0.3125px] max-w-[322px]">
        {description}
      </p>
    </div>
  );
}

interface CertificationCardProps {
  image: string; // public/ paths like "/certs/sbe.png"
  label: string;
  alt: string;
  imageClassName?: string;
}

function CertificationCard({
  image,
  label,
  alt,
  imageClassName = "",
}: CertificationCardProps) {
  return (
    <div className="bg-white flex flex-col gap-4 items-center px-4 py-2 w-full">
      <div className="bg-white relative flex items-center justify-center h-[107px] w-[106px]">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="106px"
          className={`object-contain ${imageClassName}`}
        />
      </div>

      {/* ✅ Darkened for legibility */}
      <p className="font-inter text-[#52525c] text-[16px] leading-[24px] tracking-[-0.3125px] text-center whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}

export default function WhyChooseUsSection() {
  const CERT_sbe = "/certs/sbe.png";
  const CERT_mbe = "/certs/mbe.png";
  const CERT_naisc = "/certs/naisc.png";
  const CERT_mhic = "/certs/mhic.png";
  const CERT_mdot = "/certs/mdot.png";

  return (
    <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 lg:mb-16">
          <h2 className="font-inter text-[#0a0a0a] text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] lg:text-[48px] lg:leading-[48px] tracking-[0.3516px] font-medium mb-4">
            Why Choose Us
          </h2>

          <p className="font-inter text-[#52525c] text-[18px] leading-[26px] sm:text-[20px] sm:leading-[28px] tracking-[-0.4492px] max-w-[642px] mx-auto">
            Trust the experts who deliver quality, reliability, and exceptional
            service on every project
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8 mb-12 sm:mb-14 lg:mb-16">
          <FeatureCard
            iconSrc="/icons/cert.svg"
            title="25+ Years Experience"
            description="Decades of expertise in custom iron fabrication and installation across residential and commercial sectors."
          />
          <FeatureCard
            iconSrc="/icons/sheild.svg"
            title="Licensed & Insured"
            description="Fully licensed, bonded, and insured for your peace of mind. We meet all local building codes and regulations."
          />
          <FeatureCard
            iconSrc="/icons/check.svg"
            title="Quality Guaranteed"
            description="We stand behind our work and use only premium materials built to last."
          />
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-[#18181b] w-full">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <div className="bg-white border border-black rounded-sm px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 gap-6 place-items-center lg:flex lg:items-center lg:justify-between lg:gap-0">
              <div className="w-full lg:flex-1 lg:flex lg:justify-center">
                <CertificationCard
                  image={CERT_naisc}
                  label="NAICS Certified"
                  alt="NAICS Certification"
                  imageClassName="max-w-[97px] max-h-[107px]"
                />
              </div>

              <div className="w-full lg:flex-1 lg:flex lg:justify-center">
                <CertificationCard
                  image={CERT_mbe}
                  label="MBE Certified"
                  alt="MBE Certification"
                  imageClassName="max-w-[106px] max-h-[106px]"
                />
              </div>

              <div className="w-full lg:flex-1 lg:flex lg:justify-center">
                <CertificationCard
                  image={CERT_sbe}
                  label="SBE Certified"
                  alt="SBE Certification"
                  imageClassName="max-w-[106px] max-h-[107px]"
                />
              </div>

              <div className="w-full lg:flex-1 lg:flex lg:justify-center">
                <CertificationCard
                  image={CERT_mdot}
                  label="MDOT Certified"
                  alt="MDOT-MTA Certification"
                  imageClassName="max-w-[145px] max-h-[87px]"
                />
              </div>

              <div className="w-full lg:flex-1 lg:flex lg:justify-center">
                <CertificationCard
                  image={CERT_mhic}
                  label="MHIC Certified"
                  alt="MHIC Certification"
                  imageClassName="max-w-[145px] max-h-[87px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
