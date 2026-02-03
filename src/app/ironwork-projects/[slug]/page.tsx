import { notFound } from "next/navigation";
import { getProjectBySlug, normalizeSlug } from "@/data/projects";
import ProjectDetailsPage from "@/components/ProjectDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);
  const project = getProjectBySlug(slug);

  if (!project) {
    console.log("PROJECT NOT FOUND for slug:", slug);
    notFound();
  }

  return <ProjectDetailsPage project={project} />;
}
