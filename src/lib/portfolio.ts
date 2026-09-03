import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectDetails, ProjectSpec, WorkType } from "@/data/projects";

type PortfolioRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  work_type: WorkType;
  product_types: string[] | null;
  description: string | null;
  summary: string | null;
  year: number | null;
  image_paths: string[] | null;
  image_alt: string | null;
  specifications: unknown;
  seo_title: string | null;
  meta_description: string | null;
};

export async function getPublishedPortfolioProjects(): Promise<ProjectDetails[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Unable to load published portfolio projects:", error);
      return [];
    }
    return (data || []).map((row) => portfolioRowToProject(row as PortfolioRow));
  } catch (error) {
    console.error("Unable to initialize portfolio data:", error);
    return [];
  }
}

export async function getPublishedPortfolioProject(slug: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return portfolioRowToProject(data as PortfolioRow);
  } catch {
    return null;
  }
}

function portfolioRowToProject(row: PortfolioRow): ProjectDetails {
  const supabase = createAdminClient();
  const imagePaths = Array.isArray(row.image_paths) ? row.image_paths : [];
  const urls = imagePaths.map(
    (path) => supabase.storage.from("portfolio-images").getPublicUrl(path).data.publicUrl
  );
  const alt = row.image_alt || `${row.name} in ${row.location}`;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    workType: row.work_type,
    productTypes: row.product_types || [],
    image: urls[0] || "/images/welding_shop_sparks2.jpg",
    alt,
    description: row.description || undefined,
    summary: row.summary || undefined,
    year: row.year || undefined,
    images: urls.map((src, index) => ({ src, alt: `${alt}${urls.length > 1 ? ` — photo ${index + 1}` : ""}` })),
    specifications: isProjectSpecs(row.specifications) ? row.specifications : [],
    seoTitle: row.seo_title || undefined,
    metaDescription: row.meta_description || undefined,
  };
}

function isProjectSpecs(value: unknown): value is ProjectSpec[] {
  return Array.isArray(value) && value.every((item) =>
    Boolean(item) && typeof item === "object" &&
    typeof (item as ProjectSpec).label === "string" &&
    typeof (item as ProjectSpec).value === "string"
  );
}
