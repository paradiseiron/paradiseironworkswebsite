export const PROJECT_TYPES = [
  "Custom Design",
  "Window guards",
  "Balconies",
  "Decks",
  "Structural",
  "Railings",
  "Doors",
  "Repairs",
  "Security",
  "Stairs",
  "Other",
] as const;

export const ENGINEERING_SERVICES_OPTIONS = [
  "Client provides Engineer",
  "Paradise provides Engineer",
  "Opt out of Engineer",
] as const;

const PROJECT_TYPES_WITHOUT_ENGINEERING = new Set<string>([
  "Window guards",
  "Railings",
  "Doors",
]);

export function requiresEngineeringServices(projectType: string) {
  return Boolean(
    projectType && !PROJECT_TYPES_WITHOUT_ENGINEERING.has(projectType)
  );
}
