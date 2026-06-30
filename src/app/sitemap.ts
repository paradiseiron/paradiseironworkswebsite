import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.paradiseironworks.com";

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/quote",
    "/ironwork-projects",
    "/services/residential",
    "/services/commercial",
    "/services/structural",
    "/privacy",
    "/terms",
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
