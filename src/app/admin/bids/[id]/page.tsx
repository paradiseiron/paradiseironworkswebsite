import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, FileText, Upload } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatCalendarDate, formatWashingtonDate } from "@/lib/date-time";
import {
  getUserRole,
  hasBidWriteAccess,
  requireBidWriteRole,
} from "@/lib/roles";
import SuccessToast from "@/components/SuccessToast";

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

  const timestamp = new Date().toISOString();
  const update: Record<string, string | null> = {
    status,
    updated_at: timestamp,
  };
  if (status === "submitted") update.submitted_at = timestamp;
  if (status === "won" || status === "lost") update.outcome_at = timestamp;

  const { error } = await createAdminClient()
    .from("bid_opportunities")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  redirect(`/admin/bids/${id}?toast=status-updated`);
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

export default async function BidOpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; toast?: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const role = await getUserRole(user.id);
  const { id } = await params;
  const filters = await searchParams;
  const tab = ["overview", "scope", "estimate", "proposal"].includes(
    filters.tab || ""
  )
    ? filters.tab!
    : "overview";
  const supabase = createAdminClient();
  const [{ data: opportunity, error }, { data: documents, error: documentError }] =
    await Promise.all([
      supabase.from("bid_opportunities").select("*").eq("id", id).single(),
      supabase
        .from("bid_opportunity_documents")
        .select("*")
        .eq("bid_opportunity_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (error || !opportunity) notFound();
  if (documentError) throw new Error(documentError.message);

  const documentLinks = await Promise.all(
    (documents || []).map(async (document) => {
      const { data } = await supabase.storage
        .from("bid-opportunity-documents")
        .createSignedUrl(document.storage_path, 60 * 60);
      return { ...document, url: data?.signedUrl || "" };
    })
  );
  const canWrite = hasBidWriteAccess(role);

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
        {(["overview", "scope", "estimate", "proposal"] as const).map((item) => (
          <Link
            key={item}
            href={`/admin/bids/${id}?tab=${item}`}
            className={`shrink-0 cursor-pointer px-3 py-3 text-sm capitalize sm:px-4 ${
              tab === item
                ? "border-b-2 border-[#fb5411] text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {item}
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
