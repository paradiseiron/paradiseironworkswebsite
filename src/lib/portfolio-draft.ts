/** Draft public copy from project facts. Every field remains editable before publishing. */
export type PortfolioSource = {
  proposal_project_name?: string | null;
  project_type?: string | null;
  project_category?: string | null;
  city?: string | null;
  state?: string | null;
  completed_at?: string | null;
  proposal_scope?: string | null;
  proposal_finish?: string | null;
};

function clean(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function sentence(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function shortScope(value?: string | null) {
  const scope = clean(value)
    .replace(/(?:^|\s)[•*-]\s*/g, " ")
    .replace(/\$[\d,]+(?:\.\d{2})?/g, "")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "")
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "")
    .trim();
  if (!scope || scope.length > 500) return "";
  return scope;
}


const STATE_NAMES: Record<string, string> = {
  MD: "maryland", VA: "virginia", DC: "dc", DE: "delaware", PA: "pennsylvania", WV: "west-virginia",
};

const PROJECT_TYPE_SLUGS: Record<string, string> = {
  "custom design": "custom-metalwork",
  "window guards": "window-guards",
  balconies: "metal-balcony",
  decks: "metal-deck",
  structural: "structural-steel",
  railings: "metal-railing",
  doors: "metal-door",
  repairs: "ironwork-repair",
  security: "security-metalwork",
  stairs: "metal-staircase",
  other: "custom-metalwork",
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function suggestedPortfolioSlug(project: PortfolioSource) {
  const category = clean(project.project_category).toLowerCase();
  const title = clean(project.proposal_project_name);
  const descriptiveTitle = /\b(?:railing|rail|gate|stair|steel|iron|canopy|deck|fenc(?:e|ing)|balcon(?:y|ies)|door|security|structural|metal|window|frame|guard)\b/i.test(title);
  const work = descriptiveTitle ? title : PROJECT_TYPE_SLUGS[clean(project.project_type).toLowerCase()] || clean(project.project_type) || "custom-metalwork";
  const workSlug = slugify(work);
  const categorySlug = slugify(category);
  const distinctWork = categorySlug === "structural" && workSlug.startsWith("structural-") ? workSlug.slice("structural-".length) : workSlug;
  const state = clean(project.state);
  const location = [clean(project.city), STATE_NAMES[state.toUpperCase()] || state].filter(Boolean).join(" ");
  return [categorySlug, distinctWork, slugify(location)].filter(Boolean).join("-");
}

export function generatePortfolioDraft(project: PortfolioSource) {
  const projectType = clean(project.project_type);
  const category = clean(project.project_category).toLowerCase();
  const location = [clean(project.city), clean(project.state)].filter(Boolean).join(", ");
  const year = project.completed_at ? new Date(project.completed_at).getFullYear() : null;
  const validYear = year && Number.isFinite(year) ? year : null;
  const name = clean(project.proposal_project_name) || (projectType ? `${projectType} Project` : "Completed Project");
  const subject = projectType && projectType.toLowerCase() !== "other" ? projectType.toLowerCase() : "metalwork";
  const property = category === "residential" ? "residential property" : category === "commercial" ? "commercial property" : "property";
  const place = location ? ` in ${location}` : "";
  const opening = `Paradise Ironworks completed this ${subject} project for a ${property}${place}`;
  const scope = shortScope(project.proposal_scope);
  const description = `${sentence(opening)}${scope ? ` Scope of work: ${sentence(scope)}` : ""}`;
  const summary = `${name}${place}${validYear ? `, completed in ${validYear}` : ""} by Paradise Ironworks.`;
  const specifications = [
    projectType ? `Project type: ${projectType}` : "",
    category ? `Work type: ${category.charAt(0).toUpperCase() + category.slice(1)}` : "",
    clean(project.proposal_finish) && clean(project.proposal_finish).length <= 120 ? `Finish: ${clean(project.proposal_finish)}` : "",
  ].filter(Boolean).join("\n");
  const seoTitle = `${name}${place} | Paradise Ironworks`;
  const metaDescription = `${sentence(`${projectType || "Custom ironwork"} project completed${place} by Paradise Ironworks`)} View project photos and details.`;
  const imageAlt = `${name}${place} — completed project`;
  return { name, slug: suggestedPortfolioSlug(project), description, summary, specifications, imageAlt, seoTitle, metaDescription };
}
