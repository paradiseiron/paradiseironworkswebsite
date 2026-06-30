"use client";

import { useEffect } from "react";

export default function NewWebsiteLeadAlert({
  projectId,
}: {
  projectId: string;
}) {
  useEffect(() => {
    void fetch(`/api/projects/${encodeURIComponent(projectId)}/review`, {
      method: "POST",
    }).catch((error) => {
      console.error("Unable to mark website lead reviewed:", error);
    });
  }, [projectId]);

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/10 px-5 py-4 text-sky-100"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400" />
      <div>
        <p className="font-semibold">New website lead</p>
        <p className="text-sm text-sky-100/75">
          This quote request is now marked as reviewed.
        </p>
      </div>
    </div>
  );
}
