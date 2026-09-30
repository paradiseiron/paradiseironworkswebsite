"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";

export default function CostExtractionAction({ intakeId, retry = false }: { intakeId: string; retry?: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function process() {
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/costing/${intakeId}/process`, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || "Unable to extract this document."); setBusy(false); router.refresh(); return; }
    router.replace(`/admin/costing/${intakeId}?toast=extracted`); router.refresh();
  }
  const Icon = retry ? RefreshCw : Sparkles;
  return <div><button type="button" onClick={process} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-neutral-200 hover:bg-white/5 disabled:opacity-50"><Icon className={`size-4 ${busy ? "animate-spin" : ""}`} />{busy ? "Extracting…" : retry ? "Retry extraction" : "Extract with AI"}</button>{error && <p className="mt-2 max-w-sm text-xs text-red-400">{error}</p>}</div>;
}
