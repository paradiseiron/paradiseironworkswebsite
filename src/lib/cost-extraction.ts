import "server-only";

import { costCategories, type CostCategory } from "@/lib/costing";
import { createAdminClient } from "@/lib/supabase/admin";

type Extraction = {
  vendor_name: string | null;
  amount: number | null;
  document_date: string | null;
  invoice_number: string | null;
  purchase_order_number: string | null;
  category: CostCategory | null;
  description: string | null;
  project_source: string;
  is_general_expense: boolean;
  confidence: Record<"vendor_name" | "amount" | "document_date" | "invoice_number" | "purchase_order_number" | "category" | "description" | "project_assignment" | "overall", number>;
};

export async function processCostDocument(intakeId: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const model = process.env.OPENAI_COST_EXTRACTION_MODEL || "gpt-4.1-mini";
  const supabase = createAdminClient();
  const { data: intake, error: intakeError } = await supabase.from("cost_intake").select("*").eq("id", intakeId).maybeSingle();
  if (intakeError || !intake) throw new Error("Cost intake record not found.");
  if (intake.status === "approved" || intake.status === "rejected") throw new Error("Reviewed documents cannot be processed again.");
  await supabase.from("cost_intake").update({ status: "processing", failure_message: null, processing_started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", intakeId);
  try {
    const [{ data: file, error: fileError }, { data: projects }, { data: bids }] = await Promise.all([
      supabase.storage.from("cost-documents").download(intake.storage_path),
      supabase.from("projects").select("id, customer_name, proposal_number, project_address").eq("status", "active").order("received_at", { ascending: false }),
      supabase.from("bid_opportunities").select("id, project_name, proposal_number, general_contractor, project_address").eq("status", "won").order("outcome_at", { ascending: false }),
    ]);
    if (fileError || !file) throw new Error("Unable to read the uploaded document.");
    const options = [
      ...(projects || []).map(project => ({ source: `project:${project.id}`, type: "Residential / non-bid", name: project.customer_name, reference: project.proposal_number, address: project.project_address })),
      ...(bids || []).map(bid => ({ source: `bid:${bid.id}`, type: "Won commercial bid", name: bid.project_name, reference: bid.proposal_number, contractor: bid.general_contractor, address: bid.project_address })),
    ];
    const allowedSources = ["", ...options.map(option => option.source)];
    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${intake.content_type};base64,${bytes.toString("base64")}`;
    const documentPart = intake.content_type === "application/pdf"
      ? { type: "input_file", filename: intake.file_name, file_data: dataUrl, detail: "high" }
      : { type: "input_image", image_url: dataUrl, detail: "high" };
    const prompt = [
      "Extract one payable cost document for Paradise Ironworks. Return only the schema fields.",
      "Use the final invoice/receipt total owed, not a subtotal. Dates must be YYYY-MM-DD.",
      "Choose a project_source only when the document contains strong evidence matching one listed option. Otherwise return an empty project_source.",
      "Set is_general_expense true only when the document is clearly a company operating expense that is not attributable to a listed project.",
      "Do not invent missing values. Use null and lower confidence when unclear.",
      `Allowed categories: ${costCategories.map(([key]) => key).join(", ")}.`,
      `Available project options: ${JSON.stringify(options)}.`,
    ].join("\n");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, store: false,
        input: [{ role: "user", content: [documentPart, { type: "input_text", text: prompt }] }],
        text: { format: { type: "json_schema", name: "cost_document_extraction", strict: true, schema: extractionSchema(allowedSources) } },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed (${response.status}).`);
    const outputText = extractOutputText(payload);
    if (!outputText) throw new Error("The extraction response did not contain structured output.");
    const result = JSON.parse(outputText) as Extraction;
    const projectSource = allowedSources.includes(result.project_source) ? result.project_source : "";
    const [sourceType, sourceId] = projectSource.split(":");
    const suggestedProjectId = sourceType === "project" ? sourceId : null;
    const suggestedBidId = sourceType === "bid" ? sourceId : null;
    const preserveAssignment = Boolean(intake.project_id || intake.bid_opportunity_id || intake.is_general_expense);
    const updates = {
      vendor_name: clean(result.vendor_name), amount: validAmount(result.amount), document_date: validDate(result.document_date),
      invoice_number: clean(result.invoice_number), purchase_order_number: clean(result.purchase_order_number),
      category: validCategory(result.category), description: clean(result.description),
      ...(!preserveAssignment ? { project_id: suggestedProjectId, bid_opportunity_id: suggestedBidId, is_general_expense: !suggestedProjectId && !suggestedBidId && result.is_general_expense } : {}),
      extraction_data: result, extraction_confidence: result.confidence || {}, extraction_model: model,
      status: "needs_review", extracted_at: new Date().toISOString(), failure_message: null, updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase.from("cost_intake").update(updates).eq("id", intakeId);
    if (updateError) throw new Error("Unable to save extracted document details.");
    return { status: "needs_review" as const, confidence: Number(result.confidence?.overall || 0) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error.";
    await supabase.from("cost_intake").update({ status: "failed", failure_message: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", intakeId);
    throw error;
  }
}

function extractionSchema(projectSources: string[]) { const nullableString = { type: ["string", "null"] }; const confidence = { type: "number", minimum: 0, maximum: 1 }; return { type: "object", additionalProperties: false, properties: { vendor_name: nullableString, amount: { type: ["number", "null"], minimum: 0 }, document_date: nullableString, invoice_number: nullableString, purchase_order_number: nullableString, category: { type: ["string", "null"], enum: [...costCategories.map(([key]) => key), null] }, description: nullableString, project_source: { type: "string", enum: projectSources }, is_general_expense: { type: "boolean" }, confidence: { type: "object", additionalProperties: false, properties: { vendor_name: confidence, amount: confidence, document_date: confidence, invoice_number: confidence, purchase_order_number: confidence, category: confidence, description: confidence, project_assignment: confidence, overall: confidence }, required: ["vendor_name", "amount", "document_date", "invoice_number", "purchase_order_number", "category", "description", "project_assignment", "overall"] } }, required: ["vendor_name", "amount", "document_date", "invoice_number", "purchase_order_number", "category", "description", "project_source", "is_general_expense", "confidence"] }; }
function extractOutputText(payload: { output?: { content?: { type?: string; text?: string }[] }[] }) { return payload.output?.flatMap(item => item.content || []).find(part => part.type === "output_text")?.text || ""; }
function clean(value: string | null) { const text = value?.trim(); return text ? text.slice(0, 1000) : null; }
function validAmount(value: number | null) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null; }
function validDate(value: string | null) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null; }
function validCategory(value: CostCategory | null) { return costCategories.some(([key]) => key === value) ? value : null; }
