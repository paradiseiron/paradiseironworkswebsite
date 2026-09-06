import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/auth";
import { requireAssignedRole } from "@/lib/roles";
import { formatWashingtonDate } from "@/lib/date-time";
import { bidProposalTotal, formatBidCurrency, normalizeBidPricingItems, normalizeBidScopeSections } from "@/lib/bid-proposal";

export default async function BidProposalPreview({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser(); await requireAssignedRole(user.id);
  const { id } = await params;
  const { data: bid, error } = await createAdminClient().from("bid_opportunities").select("*").eq("id", id).single();
  if (error || !bid?.proposal_drafted_at) notFound();
  const sections = normalizeBidScopeSections(bid.proposal_scope_sections);
  const items = normalizeBidPricingItems(bid.proposal_pricing_items);
  return <main className="min-h-screen bg-neutral-200 py-8 text-neutral-950 print:bg-white print:p-0"><article className="mx-auto max-w-[850px] bg-white px-12 py-12 shadow-xl print:max-w-none print:shadow-none">
    <header className="flex justify-between gap-8 border-b border-neutral-300 pb-6"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-neutral-500">Paradise Ironworks &amp; Construction LLC</p><h1 className="mt-4 text-4xl font-bold">Commercial Bid Proposal</h1><div className="mt-4 text-sm text-neutral-600"><p><b>Proposal #:</b> {bid.proposal_number || "Draft"}</p><p><b>Date:</b> {formatWashingtonDate(bid.proposal_date)}</p></div></div><Image src="/images/paradise_ironworks_logo.png" alt="Paradise Ironworks" width={260} height={130} className="h-20 w-auto object-contain" /></header>
    <section className="mt-8 grid grid-cols-2 gap-10 text-sm leading-6"><div><h2 className="font-semibold uppercase text-neutral-500">Project</h2><p className="mt-2 font-semibold">{bid.project_name}</p><p>{[bid.project_address,bid.city,bid.state,bid.zip_code].filter(Boolean).join(", ")}</p></div><div><h2 className="font-semibold uppercase text-neutral-500">Submitted To</h2><p className="mt-2 font-semibold">{bid.proposal_recipient_company}</p><p className="whitespace-pre-wrap">{bid.proposal_recipient_address}</p><p><b>Attention:</b> {bid.proposal_attention}</p></div></section>
    <p className="mt-8 whitespace-pre-wrap text-sm leading-7">{bid.proposal_intro}</p>
    {sections.map((section, i) => <section key={i} className="mt-8"><h2 className="border-b border-neutral-300 pb-2 text-lg font-bold">{i + 1}. {section.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{section.content}</p></section>)}
    <section className="mt-8"><h2 className="border-b border-neutral-300 pb-2 text-lg font-bold">Proposal Price</h2>{bid.proposal_pricing_mode === "line_items" && <div className="mt-3"><div className="grid grid-cols-[1fr_70px_70px_110px_120px] gap-3 border-b border-neutral-300 py-2 text-xs font-bold uppercase text-neutral-500"><span>Description</span><span>Qty</span><span>UOM</span><span>Unit Price</span><span className="text-right">Amount</span></div>{items.map((item,i)=><div key={i} className="grid grid-cols-[1fr_70px_70px_110px_120px] gap-3 border-b border-neutral-200 py-2 text-sm"><span>{item.description}</span><span>{item.quantity ?? "—"}</span><span>{item.unit || "—"}</span><span>{item.unitPrice === null ? "—" : formatBidCurrency(item.unitPrice)}</span><b className="text-right">{formatBidCurrency(item.amount || 0)}</b></div>)}</div>}<p className="mt-4 text-right text-lg font-bold">{bid.proposal_pricing_mode === "lump_sum" ? "Lump Sum: " : "Total: "}{formatBidCurrency(bidProposalTotal(bid))}</p></section>
    <Section title="Clarifications & Conditions" text={bid.proposal_clarifications} /><Section title="Exclusions" text={bid.proposal_exclusions} /><Section title="Acknowledged Addenda" text={bid.proposal_addenda} /><Section title="Terms" text={bid.proposal_terms} />
    <footer className="mt-12 border-t border-neutral-300 pt-6 text-sm"><p>Respectfully,</p><p className="mt-8 font-bold">{bid.proposal_prepared_by}</p><p>{bid.proposal_prepared_by_title}</p><p>Paradise Ironworks &amp; Construction LLC</p></footer>
  </article></main>;
}
function Section({title,text}:{title:string;text?:string|null}) { if(!text) return null; return <section className="mt-8"><h2 className="border-b border-neutral-300 pb-2 text-lg font-bold">{title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{text}</p></section>; }
