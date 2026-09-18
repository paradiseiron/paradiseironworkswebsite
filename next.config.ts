import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const portfolioImagePattern = supabaseUrl
  ? [
      {
        protocol: "https" as const,
        hostname: new URL(supabaseUrl).hostname,
        pathname: "/storage/v1/object/public/portfolio-images/**",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: portfolioImagePattern,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
