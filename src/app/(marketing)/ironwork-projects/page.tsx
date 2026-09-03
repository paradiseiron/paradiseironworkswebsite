// src/app/SeeWork/page.tsx
import GalleryPage from "@/components/GalleryPage";
import { projects as staticProjects } from "@/data/projects";
import { getPublishedPortfolioProjects } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function Page() {
  const publishedProjects = await getPublishedPortfolioProjects();
  return <GalleryPage projects={[...publishedProjects, ...staticProjects]} />;
}
