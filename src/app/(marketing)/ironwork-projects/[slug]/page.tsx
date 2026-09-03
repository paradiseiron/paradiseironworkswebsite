import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, normalizeSlug, projects } from "@/data/projects";
import ProjectDetailsPage from "@/components/ProjectDetailPage";
import { getPublishedPortfolioProject } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const project =
    (await getPublishedPortfolioProject(normalizedSlug)) ||
    getProjectBySlug(normalizedSlug);

  if (!project) {
    return {};
  }

  const description =
    project.metaDescription ||
    project.summary ||
    project.description ||
    `${project.name}, a ${project.workType.toLowerCase()} ironwork project in ${project.location}.`;
  const image = project.images?.[0]?.src || project.image;
  const canonical = `/ironwork-projects/${project.slug}`;

  return {
    title: project.seoTitle || project.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: project.seoTitle || project.name,
      description,
      url: canonical,
      type: "article",
      images: image ? [{ url: image, alt: project.alt || project.name }] : [],
    },
  };
}

export default async function Page({
  params,
}: PageProps) {
  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);
  const project =
    (await getPublishedPortfolioProject(slug)) || getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailsPage project={project} />;
}
