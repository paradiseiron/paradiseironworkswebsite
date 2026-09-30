import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import JobApplicationForm from "@/components/JobApplicationForm";
import { getPublishedJob } from "@/lib/careers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Apply", robots: { index: false, follow: false } };
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) { const job = await getPublishedJob((await params).slug); if (!job) notFound(); return <main className="bg-zinc-50 px-4 py-12 sm:px-6"><div className="mx-auto max-w-4xl"><Link href={`/careers/${job.slug}`} className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"><ArrowLeft className="size-4" />Back to position</Link><div className="mt-7 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fb5411]">Application</p><h1 className="mt-2 text-3xl font-semibold text-zinc-900">{job.title}</h1><p className="mt-3 text-zinc-600">Fields marked with an asterisk are required.</p><div className="mt-10"><JobApplicationForm jobId={job.id} jobSlug={job.slug} /></div></div></div></main>; }
