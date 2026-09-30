"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, X } from "lucide-react";
import type { JobPosting } from "@/lib/careers";
import { jobTypeLabel } from "@/lib/careers";

export default function CareersListing({ jobs }: { jobs: JobPosting[] }) {
  const tags = useMemo(() => Array.from(new Set(jobs.flatMap((job) => job.tags))).sort(), [jobs]);
  const [selectedTag, setSelectedTag] = useState("All");
  const visibleJobs = selectedTag === "All" ? jobs : jobs.filter((job) => job.tags.includes(selectedTag));

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fb5411]">Join our team</p><h2 className="mt-2 text-3xl font-semibold text-zinc-900">Current openings</h2></div>
        {tags.length > 0 && <label className="w-full text-sm text-zinc-700 sm:w-64"><span className="mb-2 block">Filter by area</span><span className="relative block"><select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-zinc-300 bg-white py-0 pl-4 pr-12 text-zinc-900 outline-none focus:border-[#fb5411]"><option>All</option>{tags.map((tag) => <option key={tag}>{tag}</option>)}</select><svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg></span></label>}
      </div>
      {selectedTag !== "All" && <button type="button" onClick={() => setSelectedTag("All")} className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#fb5411]/10 px-3 py-1 text-sm text-[#b83200]">{selectedTag}<X className="size-3.5" /></button>}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {visibleJobs.map((job) => <Link key={job.id} href={`/careers/${job.slug}`} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex flex-wrap gap-2">{job.tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">{tag}</span>)}</div><h3 className="mt-5 text-2xl font-semibold text-zinc-900">{job.title}</h3><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-[#fb5411]" />{job.location}</span><span>{jobTypeLabel(job.employment_type)}</span></div><p className="mt-4 leading-7 text-zinc-600">{job.summary}</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#fb5411]">View position <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Link>)}
      </div>
      {!visibleJobs.length && <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">{jobs.length ? "No openings match this filter." : "There are no open positions right now. Please check back soon."}</div>}
    </section>
  );
}
