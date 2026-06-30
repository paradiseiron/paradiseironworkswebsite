import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

type CsvRow = Record<string, string>;

const filePath = process.argv[2];
const shouldApply = process.argv.includes("--apply");

if (!filePath) {
  throw new Error("Usage: tsx scripts/import-crm-csv.ts <csv-path> [--apply]");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase environment variables are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = parse(fs.readFileSync(filePath), {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
}) as CsvRow[];

const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function receivedDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  return `${value}-01T00:00:00.000Z`;
}

function proposalAmount(value?: string) {
  const normalized = (value || "").replace(/[$,\s]/g, "");
  return /^\d+(?:\.\d{1,2})?$/.test(normalized)
    ? Number(normalized)
    : null;
}

function contactDetails(value?: string) {
  const text = value || "";
  const email = text.match(/[^\s/]+@[^\s/]+\.[^\s/]+/)?.[0] || "";
  const phone = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)?.[0] || "";
  return { email, phone };
}

function status(value?: string) {
  const normalized = normalize(value);
  if (normalized === "won") return "active";
  return ["completed", "quoted", "pending", "active", "lost"].includes(
    normalized
  )
    ? normalized
    : "lead";
}

function mappedProject(row: CsvRow, isNew: boolean) {
  const quoteNumber = row["Quote #"].trim();
  const customerName = row["Client / Company"].trim();
  const contactName = row["Contact Person"].trim() || customerName;
  const projectType = row["Project Name / Type"].trim();
  const assignedTo =
    normalize(row["Assigned To"]) === "pending"
      ? ""
      : row["Assigned To"].trim();
  const contact = contactDetails(row["Phone / Email"]);
  const amount = proposalAmount(row["Value ($)"]);
  const receivedAt = receivedDate(row["Date Added"]);
  const proposalSentAt = validDate(row["Quote Date"]);
  const followUpAt = validDate(row["Follow-up Date"]);

  const mapped: Record<string, string | number | boolean | null> = {
    customer_name: customerName,
    contact_name: contactName,
    project_category: quoteNumber.toUpperCase().startsWith("C-")
      ? "commercial"
      : "residential",
    project_type: projectType,
    proposal_project_name: projectType,
    proposal_attention: contactName,
    proposal_number: quoteNumber,
    status: status(row.Status),
    notes: row.Notes.trim() || null,
    next_follow_up_at: followUpAt,
    updated_at: new Date().toISOString(),
  };

  if (contact.phone) mapped.phone = contact.phone;
  if (contact.email) mapped.email = contact.email;
  if (row["Lead Source"].trim()) mapped.lead_source = row["Lead Source"].trim();
  if (assignedTo) mapped.assigned_to = assignedTo;
  if (amount !== null) mapped.proposal_amount = amount;
  if (proposalSentAt) mapped.proposal_sent_at = proposalSentAt;
  if (receivedAt) mapped.received_at = receivedAt;
  if (isNew) {
    mapped.priority = "normal";
    mapped.has_open_follow_up = false;
  }

  return mapped;
}

async function run() {
  const quoteNumbers = rows.map((row) => normalize(row["Quote #"]));
  const duplicateQuotes = quoteNumbers.filter(
    (quote, index) => quoteNumbers.indexOf(quote) !== index
  );

  if (duplicateQuotes.length) {
    throw new Error(`Duplicate proposal numbers: ${duplicateQuotes.join(", ")}`);
  }

  const { data: existingProjects, error } = await supabase
    .from("projects")
    .select("id, proposal_number, lead_source");

  if (error) throw error;

  const byQuote = new Map(
    (existingProjects || [])
      .filter((project) => project.proposal_number)
      .map((project) => [normalize(project.proposal_number), project])
  );

  const matched = rows.filter((row) => byQuote.has(normalize(row["Quote #"])));
  const additions = rows.filter(
    (row) => !byQuote.has(normalize(row["Quote #"]))
  );
  const websiteProjects = (existingProjects || []).filter(
    (project) => project.lead_source === "Website"
  );

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        csvRows: rows.length,
        matched: matched.length,
        additions: additions.length,
        websiteProjectsPreserved: websiteProjects.length,
      },
      null,
      2
    )
  );

  if (!shouldApply) return;

  for (const row of matched) {
    const existing = byQuote.get(normalize(row["Quote #"]))!;
    const { error: updateError } = await supabase
      .from("projects")
      .update(mappedProject(row, false))
      .eq("id", existing.id);
    if (updateError) throw updateError;
  }

  for (const row of additions) {
    const project = mappedProject(row, true);
    const { data: inserted, error: insertError } = await supabase
      .from("projects")
      .insert(project)
      .select("id, received_at")
      .single();
    if (insertError) throw insertError;

    const { error: activityError } = await supabase
      .from("project_activities")
      .insert({
        project_id: inserted.id,
        activity_type: "status_change",
        activity_date: inserted.received_at,
        summary: "Project imported from CRM tracker.",
      });
    if (activityError) throw activityError;
  }

  console.log(`Updated ${matched.length}; inserted ${additions.length}.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
