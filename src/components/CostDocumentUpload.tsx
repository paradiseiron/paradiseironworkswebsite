"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Upload } from "lucide-react";

export default function CostDocumentUpload({ projects }: { projects: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/admin/costing/intake", { method: "POST", body: new FormData(event.currentTarget) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || "Unable to upload document."); setBusy(false); return; }
    router.push(`/admin/costing/${result.id}?toast=uploaded`); router.refresh();
  }
  return <>
    <button onClick={() => setOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white hover:bg-[#e64d0f]"><Upload className="size-4" />Upload Cost Document</button>
    {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
      <form ref={formRef} onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-2xl sm:p-6">
        <h2 className="text-xl font-semibold">Upload cost document</h2><p className="mt-1 text-sm text-neutral-400">Add an invoice, receipt, or vendor document for review.</p>
        <label className="mt-6 block text-sm text-neutral-300">Document<input required name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-2 block h-12 w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-sm text-neutral-400 file:mr-4 file:h-full file:border-0 file:bg-white/10 file:px-4 file:text-sm file:font-semibold file:text-white" /></label>
        <label className="mt-5 block text-sm text-neutral-300">Project <span className="text-neutral-500">(optional)</span><span className="relative mt-2 block"><select name="project_id" className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-4 pr-11 text-sm text-white"><option value="">Assign during review</option>{projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-neutral-500" /></span></label>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-300">Cancel</button><button disabled={busy} className="h-11 rounded-xl bg-[#fb5411] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Uploading…" : "Upload for Review"}</button></div>
      </form>
    </div>}
  </>;
}
