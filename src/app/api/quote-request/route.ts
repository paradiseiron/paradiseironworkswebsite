import { NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sendNewLeadNotification } from "@/lib/email/new-lead-notification";
import { sendNewLeadPushNotification } from "@/lib/push/send-new-lead-push";
import {
  ENGINEERING_SERVICES_OPTIONS,
  PROJECT_TYPES,
  requiresEngineeringServices,
} from "@/lib/project-options";
import {
  isAllowedQuoteAttachment,
  QUOTE_ATTACHMENT_MAX_FILES,
  QUOTE_ATTACHMENT_MAX_FILE_BYTES,
  QUOTE_ATTACHMENT_MAX_TOTAL_BYTES,
  safeAttachmentName,
} from "@/lib/quote-attachments";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type QuoteRequestBody = {
  name?: string;
  phone?: string;
  email?: string;
  zip?: string;
  projectCategory?: string;
  projectType?: string;
  engineeringServices?: string;
  comments?: string;
  attachments?: {
    name?: unknown;
    type?: unknown;
    size?: unknown;
  }[];
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();
const allowedCategories = new Set(["residential", "commercial"]);
const allowedProjectTypes = new Set<string>(PROJECT_TYPES);
const allowedEngineeringServices = new Set<string>(
  ENGINEERING_SERVICES_OPTIONS
);

function exceedsLength(value: string | null | undefined, max: number) {
  return Boolean(value && value.length > max);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recentRequests = (requestLog.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return false;
}

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 20_000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = (await req.json()) as QuoteRequestBody;

    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const zip = body.zip?.trim() || null;
    const projectCategory = body.projectCategory?.trim();
    const projectType = body.projectType?.trim() || null;
    const engineeringServices = body.engineeringServices?.trim() || null;
    const comments = body.comments?.trim() || null;
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((file) => ({
          name: typeof file.name === "string" ? file.name : "",
          type: typeof file.type === "string" ? file.type.toLowerCase() : "",
          size:
            typeof file.size === "number" && Number.isFinite(file.size)
              ? file.size
              : -1,
        }))
      : [];

    if (!name || name.length < 2 || exceedsLength(name, 100)) {
      return NextResponse.json(
        { error: "Please enter a valid customer name." },
        { status: 400 }
      );
    }

    if (
      !phone ||
      !/^(?:\+?1)?\d{10}$/.test(phone.replace(/\D/g, "")) ||
      exceedsLength(phone, 30)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid US phone number." },
        { status: 400 }
      );
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      exceedsLength(email, 254)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!zip || !/^\d{5}(?:-\d{4})?$/.test(zip)) {
      return NextResponse.json(
        { error: "Please enter a valid ZIP code." },
        { status: 400 }
      );
    }

    if (!projectCategory || !allowedCategories.has(projectCategory)) {
      return NextResponse.json(
        { error: "Please choose a valid project category." },
        { status: 400 }
      );
    }

    if (!projectType || !allowedProjectTypes.has(projectType)) {
      return NextResponse.json(
        { error: "Please choose a valid project type." },
        { status: 400 }
      );
    }

    if (
      requiresEngineeringServices(projectType) &&
      (!engineeringServices ||
        !allowedEngineeringServices.has(engineeringServices))
    ) {
      return NextResponse.json(
        { error: "Please choose a valid engineering service option." },
        { status: 400 }
      );
    }

    if (exceedsLength(comments, 2_000)) {
      return NextResponse.json(
        { error: "Comments must be 2,000 characters or fewer." },
        { status: 400 }
      );
    }

    if (
      attachments.length > QUOTE_ATTACHMENT_MAX_FILES ||
      attachments.some(
        (file) =>
          !isAllowedQuoteAttachment(file) ||
          file.size <= 0 ||
          file.size > QUOTE_ATTACHMENT_MAX_FILE_BYTES
      ) ||
      attachments.reduce((total, file) => total + file.size, 0) >
        QUOTE_ATTACHMENT_MAX_TOTAL_BYTES
    ) {
      return NextResponse.json(
        { error: "Please choose valid attachments within the upload limits." },
        { status: 400 }
      );
    }

    const receivedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        customer_name: name,
        contact_name: name,
        phone,
        email,
        zip_code: zip,
        project_category: projectCategory,
        project_type: projectType,
        engineering_services: requiresEngineeringServices(projectType)
          ? engineeringServices
          : null,
        lead_source: "Website",
        status: "lead",
        priority: "normal",
        received_at: receivedAt,
        notes: comments,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase quote insert error:", error);

      return NextResponse.json(
        { error: "Unable to submit your quote request." },
        { status: 500 }
      );
    }

    const { error: activityError } = await supabaseAdmin
      .from("project_activities")
      .insert({
        project_id: data.id,
        activity_type: "status_change",
        activity_date: receivedAt,
        summary: "Website lead received and project record created.",
      });

    if (activityError) {
      console.error("Website lead timeline insert error:", activityError);
      await supabaseAdmin.from("projects").delete().eq("id", data.id);

      return NextResponse.json(
        { error: "Unable to submit your quote request." },
        { status: 500 }
      );
    }

    let attachmentToken: string | null = null;
    const uploads: { path: string; signedUrl: string }[] = [];

    if (attachments.length) {
      attachmentToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256")
        .update(attachmentToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { error: sessionError } = await supabaseAdmin
        .from("quote_attachment_sessions")
        .insert({
          project_id: data.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

      if (sessionError) {
        console.error("Quote attachment session error:", sessionError);
        await supabaseAdmin.from("projects").delete().eq("id", data.id);
        return NextResponse.json(
          { error: "Unable to prepare quote attachments." },
          { status: 500 }
        );
      }

      for (const attachment of attachments) {
        const path = `${data.id}/website/${randomUUID()}-${safeAttachmentName(
          attachment.name
        )}`;
        const { data: signedUpload, error: signedUploadError } =
          await supabaseAdmin.storage
            .from("quote-attachments")
            .createSignedUploadUrl(path);
        if (signedUploadError || !signedUpload?.token) {
          console.error("Quote signed upload error:", signedUploadError);
          await supabaseAdmin.from("projects").delete().eq("id", data.id);
          return NextResponse.json(
            { error: "Unable to prepare quote attachments." },
            { status: 500 }
          );
        }
        uploads.push({ path, signedUrl: signedUpload.signedUrl });
      }
    }

    const emailNotificationSent = await sendNewLeadNotification({
      projectId: String(data.id),
      name,
      phone,
      email,
      zip,
      projectCategory,
      projectType,
      engineeringServices: requiresEngineeringServices(projectType)
        ? engineeringServices
        : null,
      comments,
    }).catch((notificationError) => {
      console.error("Lead notification email error:", notificationError);
      return false;
    });
    const pushNotificationSent = await sendNewLeadPushNotification({
      projectId: String(data.id),
      name,
      projectType,
    }).catch((notificationError) => {
      console.error("Lead push notification error:", notificationError);
      return false;
    });

    return NextResponse.json({
      success: true,
      projectId: data.id,
      emailNotificationSent,
      pushNotificationSent,
      attachmentToken,
      uploads,
    });
  } catch (err) {
    console.error("Quote request API error:", err);

    return NextResponse.json(
      { error: "Invalid quote request." },
      { status: 400 }
    );
  }
}
