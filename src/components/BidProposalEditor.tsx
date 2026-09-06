"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  normalizeBidPricingItems,
  normalizeBidScopeSections,
} from "@/lib/bid-proposal";

type Bid = Record<string, unknown>;

export default function BidProposalEditor({
  bid,
  action,
}: {
  bid: Bid;
  action: (formData: FormData) => void;
}) {
  const [mode, setMode] = useState(String(bid.proposal_pricing_mode || "lump_sum"));
  const [sections, setSections] = useState(() => {
    const saved = normalizeBidScopeSections(bid.proposal_scope_sections);
    return saved.length ? saved : [{ title: "Scope of Work", content: String(bid.scope_summary || "") }];
  });
  const [items, setItems] = useState(() => {
    const saved = normalizeBidPricingItems(bid.proposal_pricing_items);
    return saved.length ? saved : [{ description: "", quantity: null, unit: "", unitPrice: null, amount: null }];
  });

  return (
    <form id="bid-proposal-form" action={action} className="space-y-6">
      <input type="hidden" name="id" value={String(bid.id)} />
      <Card title="Proposal Information">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Proposal Number" name="proposal_number" value={bid.proposal_number} />
          <Field label="Proposal Date" name="proposal_date" type="date" value={bid.proposal_date} required />
          <Field label="Recipient Company" name="proposal_recipient_company" value={bid.proposal_recipient_company || bid.general_contractor} required />
          <Field label="Attention" name="proposal_attention" value={bid.proposal_attention} required />
          <Area label="Recipient Address" name="proposal_recipient_address" value={bid.proposal_recipient_address} rows={3} wide />
          <Area label="Introduction" name="proposal_intro" value={bid.proposal_intro} rows={4} wide required />
        </div>
      </Card>

      <Card title="Structured Scope of Work" description="Use one section for each major assembly or division. Add bullets and numbered subsections on separate lines.">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input name="scope_title" required value={section.title} onChange={(e) => setSections((all) => all.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} placeholder="Section title" className={inputClass} />
                <button type="button" aria-label="Remove scope section" onClick={() => setSections((all) => all.filter((_, i) => i !== index))} className="h-12 rounded-xl border border-white/10 px-4 text-neutral-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea name="scope_content" required value={section.content} onChange={(e) => setSections((all) => all.map((row, i) => i === index ? { ...row, content: e.target.value } : row))} rows={7} placeholder={'• Furnish and install…\n1. Delegated Design\nDescribe the subsection…'} className={`${inputClass} mt-3 h-auto py-3`} />
            </div>
          ))}
          <button type="button" onClick={() => setSections((all) => [...all, { title: "", content: "" }])} className={secondaryButton}><Plus className="h-4 w-4" /> Add scope section</button>
        </div>
      </Card>

      <Card title="Proposal Price" description="Present one lump sum or provide a broad line-item breakdown.">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {[['lump_sum', 'Lump sum'], ['line_items', 'Broad line items']].map(([value, label]) => (
            <label key={value} className={`cursor-pointer rounded-xl border p-4 text-sm ${mode === value ? 'border-[#fb5411] bg-[#fb5411]/10 text-white' : 'border-white/10 text-neutral-300'}`}>
              <input className="mr-3 accent-[#fb5411]" type="radio" name="proposal_pricing_mode" value={value} checked={mode === value} onChange={() => setMode(value)} />{label}
            </label>
          ))}
        </div>
        {mode === "lump_sum" ? (
          <Field label="Lump Sum Amount" name="proposal_lump_sum_amount" type="number" value={bid.proposal_lump_sum_amount || bid.estimated_contract_value} required />
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_90px_90px_130px_140px_auto]">
                <input name="pricing_description" required value={item.description} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} placeholder="Broad line item" className={inputClass} />
                <input name="pricing_quantity" type="number" min="0" step="0.01" value={item.quantity ?? ""} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, quantity: e.target.value === '' ? null : Number(e.target.value) } : row))} placeholder="Qty" className={inputClass} />
                <input name="pricing_unit" value={item.unit} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, unit: e.target.value } : row))} placeholder="UOM" className={inputClass} />
                <input name="pricing_unit_price" type="number" min="0" step="0.01" value={item.unitPrice ?? ""} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, unitPrice: e.target.value === '' ? null : Number(e.target.value) } : row))} placeholder="Unit price" className={inputClass} />
                <input name="pricing_amount" required type="number" min="0" step="0.01" value={item.amount ?? ""} onChange={(e) => setItems((all) => all.map((row, i) => i === index ? { ...row, amount: e.target.value === '' ? null : Number(e.target.value) } : row))} placeholder="Amount" className={inputClass} />
                <button type="button" aria-label="Remove pricing item" onClick={() => setItems((all) => all.filter((_, i) => i !== index))} className="h-12 rounded-xl border border-white/10 px-4 text-neutral-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setItems((all) => [...all, { description: "", quantity: null, unit: "", unitPrice: null, amount: null }])} className={secondaryButton}><Plus className="h-4 w-4" /> Add line item</button>
          </div>
        )}
      </Card>

      <Card title="Qualifications & Submission">
        <div className="grid gap-5 md:grid-cols-2">
          <Area label="Clarifications and Conditions" name="proposal_clarifications" value={bid.proposal_clarifications} rows={7} wide />
          <Area label="Exclusions" name="proposal_exclusions" value={bid.proposal_exclusions || bid.exclusion_notes} rows={5} />
          <Area label="Acknowledged Addenda" name="proposal_addenda" value={bid.proposal_addenda} rows={5} />
          <Area label="Terms" name="proposal_terms" value={bid.proposal_terms} rows={5} wide />
          <Field label="Prepared By" name="proposal_prepared_by" value={bid.proposal_prepared_by || "Ronald Brown"} required />
          <Field label="Title" name="proposal_prepared_by_title" value={bid.proposal_prepared_by_title || "President"} required />
        </div>
      </Card>
      <div className="flex flex-wrap justify-end gap-3">
        {Boolean(bid.proposal_drafted_at) && <><a href={`/admin/bids/${bid.id}/proposal`} target="_blank" className={secondaryButton}>Preview</a><a href={`/admin/bids/${bid.id}/proposal/pdf`} className={secondaryButton}>Download PDF</a></>}
        <button className="h-11 rounded-xl bg-[#fb5411] px-5 text-sm font-semibold text-white">Save Bid Proposal</button>
      </div>
    </form>
  );
}

const inputClass = "h-12 w-full rounded-xl border border-white/10 bg-neutral-900 px-4 text-white outline-none focus:border-[#fb5411]";
const secondaryButton = "inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 hover:bg-white/10";
function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}<div className="mt-5">{children}</div></section>; }
function Field({ label, name, value, type = "text", required }: { label: string; name: string; value?: unknown; type?: string; required?: boolean }) { return <label><span className="mb-2 block text-sm text-neutral-300">{label}{required ? " *" : ""}</span><input name={name} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '.01' : undefined} required={required} defaultValue={String(value || "")} className={inputClass} /></label>; }
function Area({ label, name, value, rows, wide, required }: { label: string; name: string; value?: unknown; rows: number; wide?: boolean; required?: boolean }) { return <label className={wide ? "md:col-span-2" : ""}><span className="mb-2 block text-sm text-neutral-300">{label}{required ? " *" : ""}</span><textarea name={name} rows={rows} required={required} defaultValue={String(value || "")} className={`${inputClass} h-auto py-3`} /></label>; }
