import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireOperationalRole } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type ClosePayload = {
  slug?: unknown;
  name?: unknown;
  productTypes?: unknown;
  description?: unknown;
  summary?: unknown;
  imagePaths?: unknown;
  imageAlt?: unknown;
  specifications?: unknown;
  seoTitle?: unknown;
  metaDescription?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  await requireOperationalRole(user.id);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as ClosePayload | null;

  const slug = text(body?.slug).toLowerCase();
  const name = text(body?.name);
  const productTypes = stringArray(body?.productTypes);
  const imagePaths = stringArray(body?.imagePaths).filter(
    (path) => path.startsWith(`${id}/`) && !path.includes("..")
  );

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Use a URL slug containing lowercase letters, numbers, and hyphens." }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  if (!productTypes.length || !imagePaths.length) {
    return NextResponse.json({ error: "Add at least one product type and one final project photo." }, { status: 400 });
  }

  const specifications = Array.isArray(body?.specifications)
    ? body.specifications.filter((item): item is { label: string; value: string } =>
        Boolean(item) && typeof item === "object" && text((item as { label?: unknown }).label).length > 0 && text((item as { value?: unknown }).value).length > 0
      ).map((item) => ({ label: text(item.label), value: text(item.value) }))
    : [];
  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, city, state, project_category, completed_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (project.status !== "completed") {
    return NextResponse.json(
      { error: "Close tools are available only after the project is completed." },
      { status: 409 }
    );
  }

  const location = [project.city, project.state].map(text).filter(Boolean).join(", ");
  const workType = portfolioWorkType(project.project_category);
  const completedDate = project.completed_at ? new Date(project.completed_at) : null;
  const year = completedDate && !Number.isNaN(completedDate.getTime())
    ? completedDate.getFullYear()
    : null;

  if (!location || !workType) {
    return NextResponse.json(
      { error: "Add the project city, state, and category in Project Details before publishing." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("portfolio_projects").upsert({
    project_id: id,
    slug,
    name,
    location,
    work_type: workType,
    product_types: productTypes,
    description: optionalText(body?.description),
    summary: optionalText(body?.summary),
    year,
    image_paths: imagePaths,
    image_alt: optionalText(body?.imageAlt),
    specifications,
    seo_title: optionalText(body?.seoTitle),
    meta_description: optionalText(body?.metaDescription),
    updated_at: now,
  }, { onConflict: "project_id" });

  if (error) {
    const message = error.code === "23505" ? "That portfolio URL slug is already in use." : "Unable to publish this portfolio project.";
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  await supabase.from("project_activities").insert({
    project_id: id,
    activity_type: "project_closed",
    activity_date: now,
    summary: "Project published to the marketing portfolio.",
  });
  revalidatePath("/ironwork-projects");
  revalidatePath(`/ironwork-projects/${slug}`);
  return NextResponse.json({ ok: true, slug });
}

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown) { return text(value) || null; }
function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}
function portfolioWorkType(value: unknown) {
  const normalized = text(value).toLowerCase();
  if (normalized === "residential") return "Residential";
  if (normalized === "commercial") return "Commercial";
  if (normalized === "structural") return "Structural";
  return "";
}
