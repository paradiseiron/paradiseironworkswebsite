"use client";

import Link from "next/link";

export default function CampaignError({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
    <h1 className="text-xl font-semibold">Campaign action could not finish</h1>
    <p className="mt-2 text-sm text-red-100">{error.message || "Please try again."}</p>
    <div className="mt-5 flex gap-4"><button type="button" onClick={reset} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white">Try again</button><Link href="/admin/campaigns" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white">Campaigns</Link></div>
  </div>;
}
