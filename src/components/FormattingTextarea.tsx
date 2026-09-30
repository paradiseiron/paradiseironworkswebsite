"use client";

import { useRef } from "react";
import { Bold, Italic, List } from "lucide-react";

export default function FormattingTextarea({
  name,
  defaultValue = "",
  required,
  rows = 5,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after = before) {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end);
    input.setRangeText(`${before}${selected || "text"}${after}`, start, end, "select");
    input.focus();
  }

  function bullets() {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const lineStart = input.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextBreak = input.value.indexOf("\n", end);
    const lineEnd = nextBreak === -1 ? input.value.length : nextBreak;
    const selected = input.value.slice(lineStart, lineEnd) || "List item";
    const formatted = selected.split("\n").map((line) => line.startsWith("- ") ? line : `- ${line}`).join("\n");
    input.setRangeText(formatted, lineStart, lineEnd, "select");
    input.focus();
  }

  return <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 focus-within:border-[#fb5411]">
    <div className="flex items-center gap-1 border-b border-white/10 bg-white/[0.03] p-2" aria-label="Text formatting">
      <FormatButton label="Bold" onClick={() => wrap("**")}><Bold className="size-4" /></FormatButton>
      <FormatButton label="Italic" onClick={() => wrap("*")}><Italic className="size-4" /></FormatButton>
      <FormatButton label="Bulleted list" onClick={bullets}><List className="size-4" /></FormatButton>
    </div>
    <textarea ref={ref} name={name} required={required} defaultValue={defaultValue} rows={rows} className="w-full resize-y bg-transparent px-4 py-3 text-white outline-none" />
  </div>;
}

function FormatButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="inline-flex size-9 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-white/10 hover:text-white">{children}</button>;
}
