"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Paperclip, Trash2 } from "lucide-react";

type Attachment = { id: string; file_name: string; attachment_type: string; url: string };

export default function RfiAttachmentManager({ bidId, rfiId, attachments, canWrite }: { bidId: string; rfiId: string; attachments: Attachment[]; canWrite: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState("request");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.set("attachment", file);
    formData.set("attachmentType", purpose);
    try {
      const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/rfis/${encodeURIComponent(rfiId)}/attachments`, { method: "POST", body: formData });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Unable to upload the attachment.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the attachment.");
    } finally { setBusy(false); }
  }

  async function remove(attachment: Attachment) {
    if (!window.confirm(`Delete ${attachment.file_name}?`)) return;
    setDeletingId(attachment.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/bids/${encodeURIComponent(bidId)}/rfis/${encodeURIComponent(rfiId)}/attachments/${encodeURIComponent(attachment.id)}`, { method: "DELETE" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Unable to delete the attachment.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the attachment.");
    } finally { setDeletingId(""); }
  }

  return <div>
    <h3 className="font-semibold">Attachments</h3>
    <p className="mt-1 text-xs leading-5 text-neutral-500">Request files accompany the outgoing question. Response files document the answer received.</p>
    <div className="mt-3 space-y-2">{attachments.map((file) => <div key={file.id} className="flex items-center gap-2 rounded-lg border border-white/10 p-2.5 text-sm text-neutral-300"><a href={file.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-[#fb5411]" /><span className="truncate">{file.file_name}</span><span className="shrink-0 text-[10px] capitalize text-neutral-500">{file.attachment_type}</span></a>{canWrite && <button type="button" onClick={() => void remove(file)} disabled={Boolean(deletingId)} aria-label={`Delete ${file.file_name}`} className="rounded-md p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40">{deletingId === file.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>}</div>)}</div>
    {canWrite && <div className="mt-4 grid items-end gap-3 sm:grid-cols-[150px_minmax(0,1fr)]"><label className="text-xs text-neutral-400">File purpose<span className="relative block"><select value={purpose} onChange={(event) => setPurpose(event.target.value)} disabled={busy} className="mt-1.5 h-11 w-full appearance-none rounded-xl border border-white/10 bg-neutral-900 pl-3 pr-11 text-sm text-white"><option value="request">Request</option><option value="response">Response</option></select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-neutral-500" /></span></label><label className="text-xs text-neutral-400">Choose file<input ref={inputRef} type="file" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])} className="mt-1.5 block h-11 w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-xs text-neutral-400 file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-white/10 file:px-3 file:text-xs file:font-semibold file:text-white disabled:opacity-50" /></label></div>}
    {busy && <p className="mt-3 inline-flex items-center gap-2 text-xs text-neutral-400"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Uploading attachment…</p>}
    {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
  </div>;
}
