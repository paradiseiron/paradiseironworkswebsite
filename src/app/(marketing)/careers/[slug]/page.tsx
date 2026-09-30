import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getPublishedJob, jobTypeLabel } from "@/lib/careers";
import { FormattedInline, FormattedJobText } from "@/components/FormattedJobText";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const job = await getPublishedJob((await params).slug); return job ? { title: `${job.title} Careers`, description: job.summary, alternates: { canonical: `/careers/${job.slug}` } } : {}; }

export default async function JobPage({ params }: Props) {
  const job = await getPublishedJob((await params).slug); if (!job) notFound();
  return <main className="bg-zinc-50"><section className="bg-zinc-950 px-6 py-16 text-white sm:py-20"><div className="mx-auto max-w-4xl"><Link href="/careers" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="size-4" />Back to careers</Link><div className="mt-8 flex flex-wrap gap-2">{job.tags.map((tag) => <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">{tag}</span>)}</div><h1 className="mt-5 text-4xl font-semibold sm:text-5xl">{job.title}</h1><div className="mt-5 flex flex-wrap gap-5 text-white/75"><span className="inline-flex items-center gap-2"><MapPin className="size-4" />{job.location}</span><span>{jobTypeLabel(job.employment_type)}</span>{job.compensation && <span>{job.compensation}</span>}</div></div></section><div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_260px]"><article className="space-y-9 text-zinc-700"><section><h2 className="text-2xl font-semibold text-zinc-900">About the position</h2><div className="mt-4 leading-7"><FormattedJobText value={job.description} /></div></section>{job.responsibilities.length > 0 && <List title="Responsibilities" items={job.responsibilities} />}{job.qualifications.length > 0 && <List title="Qualifications" items={job.qualifications} />}</article><aside><div className="sticky top-36 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-zinc-900">Interested?</h2><p className="mt-2 text-sm leading-6 text-zinc-600">Tell us about your experience and why you would be a good fit.</p><Link href={`/careers/${job.slug}/apply`} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#fb5411] px-5 font-semibold text-white hover:bg-[#e64d0f]">Apply for this position</Link></div></aside></div></main>;
}
function List({ title, items }: { title: string; items: string[] }) { return <section><h2 className="text-2xl font-semibold text-zinc-900">{title}</h2><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 leading-7"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-900" /><span><FormattedInline value={item} /></span></li>)}</ul></section>; }
