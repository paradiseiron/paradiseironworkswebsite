"use client";

import { List } from "lucide-react";

export default function BulletButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      aria-label="Toggle bullet list"
      title="Toggle bullet list"
    >
      <List className="h-4 w-4" aria-hidden="true" />
      <span>Bullets</span>
    </button>
  );
}

export function toggleBulletedLines(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextNewline = value.indexOf("\n", end);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const selectedLines = value.slice(lineStart, lineEnd).split("\n");
  const nonEmptyLines = selectedLines.filter((line) => line.trim());
  const removeBullets =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => /^\s*•\s*/.test(line));
  const formatted = selectedLines
    .map((line) => {
      if (!line.trim()) return line;
      return removeBullets ? line.replace(/^\s*•\s*/, "") : `• ${line.replace(/^\s*•\s*/, "")}`;
    })
    .join("\n");

  return {
    value: `${value.slice(0, lineStart)}${formatted}${value.slice(lineEnd)}`,
    start: lineStart,
    end: lineStart + formatted.length,
  };
}
