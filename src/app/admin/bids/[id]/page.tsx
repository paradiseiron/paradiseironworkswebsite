import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDown, Download, FileText, Mail, Plus, Upload } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatCalendarDate, formatWashingtonDate } from "@/lib/date-time";
import {
  getUserRole,
  hasBidWriteAccess,
  requireBidWriteRole,
} from "@/lib/roles";
import SuccessToast from "@/components/SuccessToast";
import BidProposalEditor from "@/components/BidProposalEditor";
import BidScheduleWorkItem, { NewScheduleCurrencyInput, type BidWorkItem } from "@/components/BidScheduleWorkItem";
import { sendBidRfiEmail } from "@/lib/email/bid-rfi";
import RfiAttachmentManager from "@/components/RfiAttachmentManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BID_STATUSES = [
  "opportunity",
  "reviewing",
  "estimating",
  "submitted",
  "won",
  "lost",
  "cancelled",
] as const;

async function updateBidStatus(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const id = String(formData.get("bid_opportunity_id") || "");
  const status = String(formData.get("status") || "");
  if (!BID_STATUSES.includes(status as (typeof BID_STATUSES)[number])) {
    throw new Error("Select a valid bid status.");
  }

  if (status === "submitted" || status === "won") {
    const { data: bid } = await createAdminClient()
      .from("bid_opportunities")
      .select("proposal_drafted_at")
      .eq("id", id)
      .single();
    if (!bid?.proposal_drafted_at) {
      throw new Error("Draft and save the bid proposal before marking this bid submitted or won.");
    }
  }

  const timestamp = new Date().toISOString();
  const update: Record<string, string | null> = {
    status,
    updated_at: timestamp,
  };
  if (status === "submitted" || status === "won") update.submitted_at = timestamp;
  if (status === "won" || status === "lost") update.outcome_at = timestamp;

  const { error } = await createAdminClient()
    .from("bid_opportunities")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`/admin/bids/${id}?toast=status-updated`);
}

async function saveBidProposal(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const id = String(formData.get("id") || "");
  const scopeSections = formData.getAll("scope_title").map((title, index) => ({
    title: String(title).trim(),
    content: String(formData.getAll("scope_content")[index] || "").trim(),
  })).filter((section) => section.title && section.content);
  const pricingMode = formData.get("proposal_pricing_mode") === "line_items" ? "line_items" : "lump_sum";
  const quantities = formData.getAll("pricing_quantity");
  const units = formData.getAll("pricing_unit");
  const unitPrices = formData.getAll("pricing_unit_price");
  const amounts = formData.getAll("pricing_amount");
  const pricingItems = formData.getAll("pricing_description").map((description, index) => ({
    description: String(description).trim(),
    quantity: quantities[index] === "" ? null : Number(quantities[index]),
    unit: String(units[index] || "").trim(),
    unitPrice: unitPrices[index] === "" ? null : Number(unitPrices[index]),
    amount: Number(amounts[index] || 0),
  })).filter((item) => item.description);
  const lumpSum = Number(formData.get("proposal_lump_sum_amount") || 0);
  const total = pricingMode === "line_items" ? pricingItems.reduce((sum, item) => sum + item.amount, 0) : lumpSum;
  if (!scopeSections.length) throw new Error("Add at least one complete scope section.");
  if (!(total > 0)) throw new Error("Enter a proposal price greater than zero.");
  const text = (name: string) => String(formData.get(name) || "").trim() || null;
  const timestamp = new Date().toISOString();
  const { error } = await createAdminClient().from("bid_opportunities").update({
    proposal_number: text("proposal_number"), proposal_date: text("proposal_date"),
    proposal_recipient_company: text("proposal_recipient_company"), proposal_recipient_address: text("proposal_recipient_address"),
    proposal_attention: text("proposal_attention"), proposal_intro: text("proposal_intro"), proposal_scope_sections: scopeSections,
    proposal_pricing_mode: pricingMode, proposal_lump_sum_amount: pricingMode === "lump_sum" ? lumpSum : null,
    proposal_pricing_items: pricingMode === "line_items" ? pricingItems : [], proposal_clarifications: text("proposal_clarifications"),
    proposal_exclusions: text("proposal_exclusions"), proposal_addenda: text("proposal_addenda"), proposal_terms: text("proposal_terms"),
    proposal_prepared_by: text("proposal_prepared_by"), proposal_prepared_by_title: text("proposal_prepared_by_title"),
    proposal_drafted_at: timestamp, estimated_contract_value: total, updated_at: timestamp,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`/admin/bids/${id}?tab=proposal&toast=proposal-saved`);
}

async function uploadBidDocuments(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireBidWriteRole(user.id);
  const id = String(formData.get("bid_opportunity_id") || "");
  const category = String(formData.get("document_category") || "other");
  const validCategory = ["drawing", "specification", "other"].includes(category)
    ? category
    : "other";
  const files = formData
    .getAll("documents")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) throw new Error("Select at least one file.");
  if (files.length > 10) throw new Error("Upload no more than 10 files at once.");
  if (files.some((file) => file.size > 25 * 1024 * 1024)) {
    throw new Error("Each bid document must be 25 MB or smaller.");
  }

  const supabase = createAdminClient();
  const uploadedPaths: string[] = [];
  try {
    const records = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("bid-opportunity-documents")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      records.push({
        bid_opportunity_id: id,
        storage_path: path,
        file_name: file.name,
        content_type: file.type || null,
        size_bytes: file.size,
        document_category: validCategory,
        uploaded_by: user.id,
      });
    }

    const { error } = await supabase
      .from("bid_opportunity_documents")
      .insert(records);
    if (error) throw error;
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from("bid-opportunity-documents").remove(uploadedPaths);
    }
    throw new Error(error instanceof Error ? error.message : "Unable to upload files.");
  }

  redirect(`/admin/bids/${id}?toast=documents-uploaded`);
}

async function requireScheduleWriteAccess(userId: string) {
  const role = await getUserRole(userId);
  if (role === "viewer" || role === "unassigned") {
    throw new Error("This action requires write access.");
  }
}

async function saveBidWorkItem(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireScheduleWriteAccess(user.id);
  const bidId = String(formData.get("bid_opportunity_id") || "");
  const workItemId = String(formData.get("work_item_id") || "");
  const description = String(formData.get("description") || "").trim();
  if (!description) throw new Error("Enter a work item description.");
  const supabase = createAdminClient();
  const { data: bid } = await supabase.from("bid_opportunities").select("id, status").eq("id", bidId).maybeSingle();
  if (!bid || bid.status !== "won") throw new Error("A schedule of work is only available for won bids.");
  const now = new Date().toISOString();
  const stage = (name: string) => formData.get(name) === "on";
  const valueText = String(formData.get("scheduled_value") || "").trim();
  if (valueText && !/^-?\d+(\.\d{1,2})?$/.test(valueText)) throw new Error("Enter a valid USD amount.");
  const itemType = formData.get("item_type") === "change_order" ? "change_order" : "original_contract";
  const approvalStatus = itemType === "change_order" ? String(formData.get("change_order_approval_status") || "proposed") : null;
  if (itemType === "change_order" && !String(formData.get("change_order_number") || "").trim()) throw new Error("Enter a change order number.");
  const numericValue = valueText ? Number(valueText) : null;
  if (numericValue !== null && (!Number.isFinite(numericValue) || (itemType === "original_contract" && numericValue < 0))) throw new Error("Enter a valid scheduled value.");
  const payload = {
    description,
    scheduled_value: numericValue,
    item_type: itemType,
    change_order_number: itemType === "change_order" ? String(formData.get("change_order_number") || "").trim() : null,
    change_order_approval_status: approvalStatus,
    change_order_approved_at: approvalStatus === "approved" ? String(formData.get("change_order_approved_at") || "") || null : null,
    notes: String(formData.get("notes") || "").trim() || null,
    fabrication_complete: stage("fabrication_complete"),
    delivery_complete: stage("delivery_complete"),
    installation_complete: stage("installation_complete"),
    ready_for_billing: stage("ready_for_billing"),
    paid: stage("paid"),
    fabrication_completed_at: stage("fabrication_complete") ? now : null,
    delivery_completed_at: stage("delivery_complete") ? now : null,
    installation_completed_at: stage("installation_complete") ? now : null,
    ready_for_billing_at: stage("ready_for_billing") ? now : null,
    paid_at: stage("paid") ? now : null,
    updated_at: now,
  };
  const result = workItemId
    ? await supabase.from("bid_work_items").update(payload).eq("id", workItemId).eq("bid_opportunity_id", bidId)
    : await supabase.from("bid_work_items").insert({ ...payload, bid_opportunity_id: bidId });
  if (result.error) throw new Error(result.error.message);
  redirect(`/admin/bids/${bidId}?tab=schedule-of-work&toast=work-item-saved`);
}

async function createBidRfi(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireScheduleWriteAccess(user.id);
  const bidId = String(formData.get("bid_opportunity_id") || "");
  const supabase = createAdminClient();
  const { data: bid } = await supabase.from("bid_opportunities").select("status, contact_email").eq("id", bidId).maybeSingle();
  if (bid?.status !== "won") throw new Error("RFIs are available only for won bids.");
  const { data: last } = await supabase.from("bid_rfis").select("rfi_number").eq("bid_opportunity_id", bidId).order("rfi_number", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("bid_rfis").insert({ bid_opportunity_id: bidId, rfi_number: (last?.rfi_number || 0) + 1, subject: "New RFI", recipient_email: bid.contact_email || null, created_by: user.id }).select("id").single();
  if (error || !data) throw new Error(error?.message || "Unable to create RFI.");
  redirect(`/admin/bids/${bidId}?tab=rfis&editRfi=${data.id}`);
}

async function saveBidRfi(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireScheduleWriteAccess(user.id);
  const bidId = String(formData.get("bid_opportunity_id") || "");
  const rfiId = String(formData.get("rfi_id") || "");
  const subject = String(formData.get("subject") || "").trim();
  const question = String(formData.get("question") || "").trim();
  if (!subject || !question) throw new Error("Enter the RFI subject and question.");
  const status = String(formData.get("status") || "draft");
  const responseText = String(formData.get("response_text") || "").trim();
  const now = new Date().toISOString();
  const { error } = await createAdminClient().from("bid_rfis").update({
    subject, question, status,
    background: String(formData.get("background") || "").trim() || null,
    recipient_email: String(formData.get("recipient_email") || "").trim() || null,
    cc_emails: String(formData.get("cc_emails") || "").trim() || null,
    drawing_references: String(formData.get("drawing_references") || "").trim() || null,
    specification_references: String(formData.get("specification_references") || "").trim() || null,
    requested_response_date: String(formData.get("requested_response_date") || "") || null,
    response_text: responseText || null,
    response_received_at: responseText ? now : null,
    affected_work_item_ids: formData.getAll("affected_work_item_ids").map(String).filter(Boolean),
    resulting_change_order_id: String(formData.get("resulting_change_order_id") || "") || null,
    updated_at: now,
  }).eq("id", rfiId).eq("bid_opportunity_id", bidId);
  if (error) throw new Error(error.message);
  redirect(`/admin/bids/${bidId}?tab=rfis&editRfi=${rfiId}&toast=rfi-saved`);
}

async function sendBidRfi(formData: FormData) {
  "use server";
  const user = await requireAuthenticatedUser();
  await requireScheduleWriteAccess(user.id);
  const bidId = String(formData.get("bid_opportunity_id") || "");
  const rfiId = String(formData.get("rfi_id") || "");
  const supabase = createAdminClient();
  const subject = String(formData.get("subject") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const recipientEmail = String(formData.get("recipient_email") || "").trim();
  if (!subject || !question || !recipientEmail) throw new Error("Enter the subject, question, and recipient email before sending.");
  const { error: saveError } = await supabase.from("bid_rfis").update({
    subject,
    question,
    background: String(formData.get("background") || "").trim() || null,
    recipient_email: recipientEmail,
    cc_emails: String(formData.get("cc_emails") || "").trim() || null,
    drawing_references: String(formData.get("drawing_references") || "").trim() || null,
    specification_references: String(formData.get("specification_references") || "").trim() || null,
    requested_response_date: String(formData.get("requested_response_date") || "") || null,
    response_text: String(formData.get("response_text") || "").trim() || null,
    affected_work_item_ids: formData.getAll("affected_work_item_ids").map(String).filter(Boolean),
    resulting_change_order_id: String(formData.get("resulting_change_order_id") || "") || null,
    updated_at: new Date().toISOString(),
  }).eq("id", rfiId).eq("bid_opportunity_id", bidId);
  if (saveError) throw new Error(saveError.message);
  const { data: bid } = await supabase.from("bid_opportunities").select("project_name, status").eq("id", bidId).maybeSingle();
  const { data: rfi } = await supabase.from("bid_rfis").select("*, bid_rfi_attachments(*)").eq("id", rfiId).eq("bid_opportunity_id", bidId).maybeSingle();
  if (!bid || bid.status !== "won" || !rfi) throw new Error("RFI not found.");
  if (!rfi.recipient_email || !rfi.question.trim()) throw new Error("Save a recipient email and question before sending.");
  const attachments = await Promise.all((rfi.bid_rfi_attachments || []).filter((file: { attachment_type: string }) => file.attachment_type === "request").map(async (file: { file_name: string; storage_path: string }) => ({ name: file.file_name, url: (await supabase.storage.from("bid-opportunity-documents").createSignedUrl(file.storage_path, 60 * 60 * 24 * 7)).data?.signedUrl || "" })));
  const cc = String(rfi.cc_emails || "").split(/[;,]/).map((email) => email.trim()).filter(Boolean);
  const result = await sendBidRfiEmail({ recipient: rfi.recipient_email, cc, projectName: bid.project_name, rfiNumber: rfi.rfi_number, subject: rfi.subject, question: rfi.question, background: rfi.background, requestedResponseDate: rfi.requested_response_date, attachmentLinks: attachments.filter((file) => file.url) });
  if (!result.ok) throw new Error(result.error);
  const sentAt = new Date().toISOString();
  await Promise.all([
    supabase.from("bid_rfis").update({ status: "sent", sent_at: sentAt, updated_at: sentAt }).eq("id", rfiId),
    supabase.from("bid_rfi_email_history").insert({ bid_rfi_id: rfiId, recipient_email: rfi.recipient_email, cc_emails: rfi.cc_emails, subject: rfi.subject, message_snapshot: { projectName: bid.project_name, rfiNumber: rfi.rfi_number, subject: rfi.subject, background: rfi.background, question: rfi.question, requestedResponseDate: rfi.requested_response_date, attachments: attachments.map((file) => file.name) }, sent_by: user.id, sent_at: sentAt }),
  ]);
  redirect(`/admin/bids/${bidId}?tab=rfis&editRfi=${rfiId}&toast=rfi-sent`);
}

export default async function BidOpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; toast?: string; editRfi?: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  const { id } = await params;
  const filters = await searchParams;
  const tab = ["overview", "proposal", "rfis", "schedule-of-work"].includes(
    filters.tab || ""
  )
    ? filters.tab!
    : "overview";
  const supabase = createAdminClient();
  const [{ data: opportunity, error }, { data: documents, error: documentError }, { data: workItems, error: workItemError }, { data: rfis, error: rfiError }] =
    await Promise.all([
      supabase.from("bid_opportunities").select("*").eq("id", id).single(),
      supabase
        .from("bid_opportunity_documents")
        .select("*")
        .eq("bid_opportunity_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("bid_work_items").select("*").eq("bid_opportunity_id", id).order("sort_order").order("created_at"),
      supabase.from("bid_rfis").select("*, bid_rfi_attachments(*), bid_rfi_email_history(*)").eq("bid_opportunity_id", id).order("rfi_number"),
    ]);

  if (error || !opportunity) notFound();
  if (documentError || workItemError || rfiError) throw new Error(documentError?.message || workItemError?.message || rfiError?.message || "Unable to load bid.");

  const rfisWithLinks = await Promise.all((rfis || []).map(async (rfi) => ({
    ...rfi,
    bid_rfi_attachments: await Promise.all((rfi.bid_rfi_attachments || []).map(async (file: { storage_path: string }) => ({ ...file, url: (await supabase.storage.from("bid-opportunity-documents").createSignedUrl(file.storage_path, 3600)).data?.signedUrl || "" }))),
  })));

  const documentLinks = await Promise.all(
    (documents || []).map(async (document) => {
      const { data } = await supabase.storage
        .from("bid-opportunity-documents")
        .createSignedUrl(document.storage_path, 60 * 60);
      return { ...document, url: data?.signedUrl || "" };
    })
  );
  const canWrite = hasBidWriteAccess(role);
  const canManageSchedule = role !== "viewer" && role !== "unassigned";

  return (
    <div>
      {filters.toast === "status-updated" && (
        <SuccessToast message="Bid status updated." queryParam="toast" />
      )}
      {filters.toast === "documents-uploaded" && (
        <SuccessToast message="Bid documents uploaded." queryParam="toast" />
      )}
      {filters.toast === "opportunity-updated" && (
        <SuccessToast message="Bid opportunity updated." queryParam="toast" />
      )}
      {filters.toast === "proposal-saved" && (
        <SuccessToast message="Bid proposal saved." queryParam="toast" />
      )}
      {filters.toast === "work-item-saved" && <SuccessToast message="Schedule of work updated." queryParam="toast" />}
      {filters.toast === "rfi-saved" && <SuccessToast message="RFI saved." queryParam="toast" />}
      {filters.toast === "rfi-sent" && <SuccessToast message="RFI email sent." queryParam="toast" />}

      <div className="mt-0 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="break-words text-2xl font-semibold sm:text-3xl">
            {opportunity.project_name}
          </h1>
          <p className="mt-2 text-neutral-400">
            Commercial Bid · {opportunity.general_contractor || "No general contractor"}
          </p>
        </div>
      </div>

      <nav className="mb-6 mt-6 flex gap-1 overflow-x-auto border-b border-white/10">
        {(["overview", "proposal", ...(opportunity.status === "won" ? ["rfis", "schedule-of-work"] : [])] as const).map((item) => (
          <Link
            key={item}
            href={`/admin/bids/${id}?tab=${item}`}
            className={`shrink-0 cursor-pointer px-3 py-3 text-sm capitalize sm:px-4 ${
              tab === item
                ? "border-b-2 border-[#fb5411] text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {item === "schedule-of-work" ? "Schedule of Work" : item === "rfis" ? "RFIs" : item}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Bid Details</h2>
            <dl className="mt-6 grid gap-5 md:grid-cols-2">
              <Detail label="General Contractor" value={opportunity.general_contractor} />
              <Detail label="Owner" value={opportunity.owner_name} />
              <Detail label="Architect" value={opportunity.architect_name} />
              <Detail label="Contact Name" value={opportunity.contact_name} />
              <Detail label="Contact Email" value={opportunity.contact_email} />
              <Detail label="Contact Phone" value={opportunity.contact_phone} />
              <Detail
                label="Project Address"
                value={[
                  opportunity.project_address,
                  opportunity.city,
                  opportunity.state,
                  opportunity.zip_code,
                ].filter(Boolean).join(", ")}
              />
              <Detail
                label="Bid Due"
                value={`${formatCalendarDate(opportunity.bid_due_date)}${
                  opportunity.bid_due_time ? ` at ${formatTime(opportunity.bid_due_time)}` : ""
                }`}
              />
              <Detail label="Priority" value={titleCase(opportunity.priority)} />
              <Detail
                label="Estimated Contract Value"
                value={opportunity.estimated_contract_value ? currency(Number(opportunity.estimated_contract_value)) : ""}
              />
              <Detail
                label="Probability"
                value={opportunity.probability === null ? "" : `${opportunity.probability}%`}
              />
              <Detail label="Created" value={formatWashingtonDate(opportunity.created_at)} />
              <Detail label="Scope Summary" value={opportunity.scope_summary} />
              <Detail label="Exclusion Notes" value={opportunity.exclusion_notes} />
            </dl>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Status</h2>
              {canWrite ? (
                <form action={updateBidStatus} className="mt-4">
                  <input type="hidden" name="bid_opportunity_id" value={id} />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <select
                        name="status"
                        defaultValue={opportunity.status}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 pr-12 text-white outline-none focus:border-[#fb5411]"
                      >
                        {BID_STATUSES.map((status) => (
                          <option key={status} value={status}>{titleCase(status)}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 8-8 8" />
                      </svg>
                      <span>Update</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-4 text-sm capitalize text-neutral-300">
                  {titleCase(opportunity.status)}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <h2 className="text-xl font-semibold">Notes</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                {opportunity.notes || "No notes yet."}
              </p>
            </section>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Drawings &amp; Specifications</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Store plans, drawings, specifications, and other pre-bid files.
                </p>
              </div>
            </div>

            {canWrite && (
              <form action={uploadBidDocuments} className="mt-5 rounded-xl border border-dashed border-white/15 bg-black/10 p-4">
                <input type="hidden" name="bid_opportunity_id" value={id} />
                <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                  <label>
                    <span className="mb-2 block text-sm text-neutral-300">Document type</span>
                    <select name="document_category" className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-neutral-900 px-3 pr-9 text-white">
                      <option value="drawing">Drawing</option>
                      <option value="specification">Specification</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm text-neutral-300">Files</span>
                    <input
                      name="documents"
                      type="file"
                      multiple
                      required
                      className="block h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-neutral-900 text-sm text-neutral-300 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-white/10 file:px-4 file:text-sm file:font-semibold file:text-white"
                    />
                  </label>
                  <button className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white hover:bg-[#e64d0f]">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload
                  </button>
                </div>
                <p className="mt-3 text-xs text-neutral-500">Up to 10 files at once; 25 MB maximum per file.</p>
              </form>
            )}

            <div className="mt-5 grid gap-3">
              {documentLinks.length ? documentLinks.map((document) => (
                <a
                  key={document.id}
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:bg-white/[0.06]"
                >
                  <FileText className="h-5 w-5 shrink-0 text-[#fb5411]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{document.file_name}</p>
                    <p className="mt-1 text-xs capitalize text-neutral-500">
                      {document.document_category} · {formatBytes(document.size_bytes)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                </a>
              )) : (
                <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">No bid documents uploaded yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : tab === "proposal" && canWrite ? (
        <BidProposalEditor bid={opportunity} action={saveBidProposal} />
      ) : tab === "proposal" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Bid Proposal</h2>
          {opportunity.proposal_drafted_at ? (
            <div className="mt-5 flex gap-3">
              <a href={`/admin/bids/${id}/proposal`} target="_blank" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">Preview</a>
              <a href={`/admin/bids/${id}/proposal/pdf`} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">Download PDF</a>
            </div>
          ) : <p className="mt-2 text-neutral-400">No proposal has been drafted.</p>}
        </section>
      ) : tab === "schedule-of-work" && opportunity.status === "won" ? (
        <ScheduleOfWork
          bidId={id}
          workItems={workItems || []}
          canWrite={canManageSchedule}
        />
      ) : tab === "rfis" && opportunity.status === "won" ? (
        <RfiPanel bidId={id} rfis={rfisWithLinks} workItems={workItems || []} canWrite={canManageSchedule} editRfiId={filters.editRfi || ""} />
      ) : (
        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold capitalize text-white">{tab}</h2>
          <p className="mt-2 text-sm text-neutral-400">
            This section is ready to be defined in the next phase.
          </p>
        </section>
      )}
    </div>
  );
}

type BidRfi = {
  id: string; rfi_number: number; status: string; subject: string; question: string; background: string | null;
  recipient_email: string | null; cc_emails: string | null; drawing_references: string | null;
  specification_references: string | null; requested_response_date: string | null; response_text: string | null;
  sent_at: string | null; response_received_at: string | null;
  affected_work_item_ids: string[]; resulting_change_order_id: string | null;
  bid_rfi_attachments: Array<{ id: string; file_name: string; attachment_type: string; url: string }>;
  bid_rfi_email_history: Array<{ id: string; recipient_email: string; sent_at: string }>;
};

function RfiPanel({ bidId, rfis, workItems, canWrite, editRfiId }: { bidId: string; rfis: BidRfi[]; workItems: BidWorkItem[]; canWrite: boolean; editRfiId: string }) {
  const selected = rfis.find((rfi) => rfi.id === editRfiId) || rfis[0];
  return <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">RFIs</h2><p className="mt-1 text-xs text-neutral-500">{rfis.length} total</p></div>{canWrite && <form action={createBidRfi}><input type="hidden" name="bid_opportunity_id" value={bidId} /><button className="rounded-lg bg-[#fb5411] p-2 text-white" aria-label="Create RFI"><Plus className="h-4 w-4" /></button></form>}</div>
      <div className="mt-4 space-y-2">{rfis.map((rfi) => {
        const overdue = rfi.requested_response_date && !["responded", "closed"].includes(rfi.status) && rfi.requested_response_date < new Date().toISOString().slice(0, 10);
        return <Link key={rfi.id} href={`/admin/bids/${bidId}?tab=rfis&editRfi=${rfi.id}`} className={`block rounded-xl border p-3 transition ${selected?.id === rfi.id ? "border-[#fb5411]/50 bg-[#fb5411]/10" : "border-white/10 bg-black/10 hover:bg-white/5"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">RFI {rfi.rfi_number}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${overdue ? "bg-red-500/15 text-red-300" : "bg-white/10 text-neutral-400"}`}>{overdue ? "Overdue" : rfi.status.replaceAll("_", " ")}</span></div><p className="mt-2 line-clamp-2 text-xs text-neutral-400">{rfi.subject}</p></Link>;
      })}{!rfis.length && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-neutral-500">No RFIs yet.</p>}</div>
    </aside>
    {selected ? <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-[#ff7a45]">Request for Information</p><h2 className="mt-1 text-2xl font-semibold">RFI {selected.rfi_number}</h2></div><div className="flex items-center gap-3">{selected.sent_at && <p className="text-xs text-neutral-500">Last sent {formatWashingtonDate(selected.sent_at)}</p>}<a href={`/admin/bids/${bidId}/rfis/${selected.id}/pdf`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-neutral-300"><Download className="mr-1.5 inline h-3.5 w-3.5" />PDF</a></div></div>
      <form action={saveBidRfi} className="mt-6 space-y-4">
        <input type="hidden" name="bid_opportunity_id" value={bidId} /><input type="hidden" name="rfi_id" value={selected.id} />
        <div className="grid gap-4 sm:grid-cols-[1fr_190px]"><RfiField label="Subject"><input name="subject" required defaultValue={selected.subject} disabled={!canWrite} className={rfiInput} /></RfiField><RfiField label="Status"><RfiSelect name="status" defaultValue={selected.status} disabled={!canWrite}><option value="draft">Draft</option><option value="ready_to_send">Ready to Send</option><option value="sent">Sent</option><option value="responded">Responded</option><option value="closed">Closed</option></RfiSelect></RfiField></div>
        <div className="grid gap-4 sm:grid-cols-2"><RfiField label="Recipient email"><input name="recipient_email" type="email" defaultValue={selected.recipient_email || ""} disabled={!canWrite} className={rfiInput} /></RfiField><RfiField label="CC emails"><input name="cc_emails" defaultValue={selected.cc_emails || ""} disabled={!canWrite} placeholder="Separate with commas" className={rfiInput} /></RfiField></div>
        <div className="grid gap-4 sm:grid-cols-3"><RfiField label="Requested response"><input name="requested_response_date" type="date" defaultValue={selected.requested_response_date || ""} disabled={!canWrite} className={rfiInput} /></RfiField><RfiField label="Drawing references"><input name="drawing_references" defaultValue={selected.drawing_references || ""} disabled={!canWrite} className={rfiInput} /></RfiField><RfiField label="Specification references"><input name="specification_references" defaultValue={selected.specification_references || ""} disabled={!canWrite} className={rfiInput} /></RfiField></div>
        <RfiField label="Background"><textarea name="background" rows={3} defaultValue={selected.background || ""} disabled={!canWrite} className={rfiTextarea} /></RfiField>
        <RfiField label="Question"><textarea name="question" required rows={5} defaultValue={selected.question} disabled={!canWrite} className={rfiTextarea} /></RfiField>
        <div className="grid gap-4 sm:grid-cols-2"><RfiField label="Affected schedule items"><select name="affected_work_item_ids" multiple defaultValue={selected.affected_work_item_ids || []} disabled={!canWrite} className={`${rfiTextarea} min-h-28`}>{workItems.map((item, index) => <option key={item.id} value={item.id}>Item {index + 1} – {item.description}</option>)}</select><span className="mt-1 block text-[10px] text-neutral-500">Hold Ctrl/Command to select multiple items.</span></RfiField><RfiField label="Resulting change order"><RfiSelect name="resulting_change_order_id" defaultValue={selected.resulting_change_order_id || ""} disabled={!canWrite}><option value="">None</option>{workItems.filter((item) => item.item_type === "change_order").map((item) => <option key={item.id} value={item.id}>{item.change_order_number} – {item.description}</option>)}</RfiSelect></RfiField></div>
        <RfiField label="Response"><textarea name="response_text" rows={5} defaultValue={selected.response_text || ""} disabled={!canWrite} placeholder="Store the received response here" className={rfiTextarea} /></RfiField>
        {canWrite && <div className="flex flex-wrap justify-end gap-3"><button className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-white/5">Save RFI</button><button formAction={sendBidRfi} className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-4 py-2.5 text-sm font-semibold text-white"><Mail className="h-4 w-4" />Save &amp; Send</button></div>}
      </form>
      <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 md:grid-cols-2">
        <RfiAttachmentManager bidId={bidId} rfiId={selected.id} attachments={selected.bid_rfi_attachments} canWrite={canWrite} />
        <div><h3 className="font-semibold">Email history</h3><div className="mt-3 space-y-2">{selected.bid_rfi_email_history.sort((a,b) => b.sent_at.localeCompare(a.sent_at)).map((email) => <div key={email.id} className="rounded-lg border border-white/10 p-2.5 text-xs text-neutral-400"><p className="text-neutral-200">Sent to {email.recipient_email}</p><p className="mt-1">{formatWashingtonDate(email.sent_at)}</p></div>)}{!selected.bid_rfi_email_history.length && <p className="text-sm text-neutral-500">Not emailed yet.</p>}</div></div>
      </div>
    </section> : <section className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-neutral-500">Create an RFI to begin.</section>}
  </div>;
}

const rfiInput = "mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-[#fb5411] disabled:opacity-70";
const rfiTextarea = "mt-1.5 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none focus:border-[#fb5411] disabled:opacity-70";
function RfiField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs text-neutral-400">{label}{children}</label>; }
function RfiSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <span className="relative block"><select {...props} className={`${rfiInput} appearance-none pr-11`}>{children}</select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-neutral-500" /></span>; }

function ScheduleOfWork({ bidId, workItems, canWrite }: { bidId: string; workItems: BidWorkItem[]; canWrite: boolean }) {
  const originalTotal = workItems.filter((item) => item.item_type !== "change_order").reduce((sum, item) => sum + Number(item.scheduled_value || 0), 0);
  const approvedChangeTotal = workItems.filter((item) => item.item_type === "change_order" && item.change_order_approval_status === "approved").reduce((sum, item) => sum + Number(item.scheduled_value || 0), 0);
  const pendingChangeTotal = workItems.filter((item) => item.item_type === "change_order" && ["proposed", "pending_approval"].includes(item.change_order_approval_status || "")).reduce((sum, item) => sum + Number(item.scheduled_value || 0), 0);
  return <div className="space-y-5">
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Schedule of Work</h2>
      <p className="mt-2 text-sm text-neutral-400">Track each scope item from fabrication through payment. These items also appear as selectable projects on the calendar.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScheduleTotal label="Original contract" value={originalTotal} />
        <ScheduleTotal label="Approved changes" value={approvedChangeTotal} />
        <ScheduleTotal label="Revised contract" value={originalTotal + approvedChangeTotal} accent />
        <ScheduleTotal label="Pending changes" value={pendingChangeTotal} />
      </div>
      {!workItems.length && <p className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-neutral-500">No work items have been entered.</p>}
      <div className="mt-5 space-y-4">
        {workItems.map((item, index) => <BidScheduleWorkItem key={item.id} bidId={bidId} item={item} displayNumber={index + 1} canWrite={canWrite} />)}
      </div>
    </section>
    {canWrite && <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 sm:p-6">
      <h3 className="font-semibold">Add work item</h3>
      <NewWorkItemForm bidId={bidId} />
    </section>}
  </div>;
}

function NewWorkItemForm({ bidId }: { bidId: string }) {
  return <form action={saveBidWorkItem} className="rounded-xl border border-white/10 bg-black/15 p-4">
    <input type="hidden" name="bid_opportunity_id" value={bidId} />
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
      <label className="text-xs text-neutral-400">Work description<input name="description" required className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white" /></label>
      <label className="text-xs text-neutral-400">Scheduled value<NewScheduleCurrencyInput /></label>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-4">
      <label className="text-xs text-neutral-400">Item type<span className="relative block"><select name="item_type" className="mt-1.5 h-11 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-3 pr-11 text-sm text-white"><option value="original_contract">Original Contract</option><option value="change_order">Change Order</option></select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-neutral-500" aria-hidden="true" /></span></label>
      <label className="text-xs text-neutral-400">Change order number<input name="change_order_number" placeholder="Required for change orders" className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white" /></label>
      <label className="text-xs text-neutral-400">Approval status<span className="relative block"><select name="change_order_approval_status" className="mt-1.5 h-11 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-3 pr-11 text-sm text-white"><option value="proposed">Proposed</option><option value="pending_approval">Pending Approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-neutral-500" aria-hidden="true" /></span></label>
      <label className="text-xs text-neutral-400">Approval date<input name="change_order_approved_at" type="date" className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white" /></label>
    </div>
    <label className="mt-3 block text-xs text-neutral-400">Notes<textarea name="notes" rows={2} className="mt-1.5 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" /></label>
    <div className="mt-3 flex justify-end"><button className="inline-flex items-center gap-2 rounded-xl bg-[#fb5411] px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add item</button></div>
  </form>;
}

function ScheduleTotal({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-xl border p-3 ${accent ? "border-[#fb5411]/40 bg-[#fb5411]/10" : "border-white/10 bg-black/15"}`}><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 text-lg font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)}</p></div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</dt>
      <dd className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-200">{value || "—"}</dd>
    </div>
  );
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string) {
  const [hourValue, minute = "00"] = value.split(":");
  const hour = Number(hourValue);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
