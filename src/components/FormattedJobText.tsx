import { Fragment } from "react";

export function FormattedJobText({ value }: { value: string }) {
  const blocks = value.split(/\n{2,}/).filter(Boolean);
  return <div className="space-y-4">{blocks.map((block, index) => {
    const lines = block.split("\n");
    const isList = lines.every((line) => /^\s*-\s+/.test(line));
    return isList ? <ul key={index} className="space-y-2 pl-1">{lines.map((line, lineIndex) => <li key={lineIndex} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-900" /><span>{inline(line.replace(/^\s*-\s+/, ""))}</span></li>)}</ul> : <p key={index} className="whitespace-pre-line">{inline(block)}</p>;
  })}</div>;
}

export function FormattedInline({ value }: { value: string }) { return <>{inline(value.replace(/^\s*-\s+/, ""))}</>; }

function inline(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
