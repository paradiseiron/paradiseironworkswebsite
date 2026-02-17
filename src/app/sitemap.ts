import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.paradiseironworks.com";

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/quote",
    "/reviews",
    "/faq",
    "/service-areas",
    "/work",
    "/ironwork-projects",
  ];

  const staticUrls = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const projectUrls = projects.map((project) => ({
    url: `${baseUrl}/ironwork-projects/${project.slug}`,
    lastModified: new Date(),
  }));

  return [...staticUrls, ...projectUrls];
}
