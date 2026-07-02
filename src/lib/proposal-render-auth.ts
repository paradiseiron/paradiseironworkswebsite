import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const PROPOSAL_RENDER_COOKIE = "proposal_render";

const TOKEN_LIFETIME_MS = 60_000;

export function createProposalRenderToken(projectId: string) {
  const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
  const payload = `${projectId}:${expiresAt}`;
  const signature = sign(payload);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export async function getProposalRenderProjectId() {
  const token = (await cookies()).get(PROPOSAL_RENDER_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf(":");
    if (separator < 0) return null;

    const payload = decoded.slice(0, separator);
    const suppliedSignature = decoded.slice(separator + 1);
    const expectedSignature = sign(payload);
    const supplied = Buffer.from(suppliedSignature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      return null;
    }

    const expiresSeparator = payload.lastIndexOf(":");
    if (expiresSeparator < 0) return null;

    const projectId = payload.slice(0, expiresSeparator);
    const expiresAt = Number(payload.slice(expiresSeparator + 1));

    if (!projectId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    return projectId;
  } catch {
    return null;
  }
}

function sign(payload: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createHmac("sha256", secret).update(payload).digest("hex");
}
