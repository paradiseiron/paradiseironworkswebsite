import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let browserInstance: Browser | null = null;
let browserLaunch: Promise<Browser> | null = null;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await requireAuthenticatedUser();
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("proposal_number")
    .eq("id", id)
    .single();

  if (error || !project) {
    return new NextResponse("Project not found", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const proposalUrl = `${origin}/admin/projects/${id}/proposal`;
  let page: Page | undefined;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    const cookies = request.cookies.getAll();

    if (cookies.length > 0) {
      await page.setCookie(
        ...cookies.map(({ name, value }) => ({
          name,
          value,
          url: origin,
        }))
      );
    }

    const response = await page.goto(proposalUrl, {
      waitUntil: "networkidle0",
    });

    if (!response?.ok()) {
      throw new Error(
        `Proposal preview returned ${response?.status() ?? "no response"}`
      );
    }

    const loadedUrl = new URL(page.url());
    if (
      loadedUrl.pathname !== `/admin/projects/${id}/proposal` ||
      !(await page.$(".proposal-document"))
    ) {
      throw new Error(`Proposal preview redirected to ${loadedUrl.pathname}`);
    }

    await page.emulateMediaType("print");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((image) => !image.complete)
          .map(
            (image) =>
              new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true });
                image.addEventListener("error", () => resolve(), { once: true });
              })
          )
      );
    });

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const filename = safeFilename(project.proposal_number || "proposal");

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Proposal PDF generation failed:", error);
    return new NextResponse("Unable to generate proposal PDF.", {
      status: 500,
    });
  } finally {
    await page?.close().catch(() => undefined);
  }
}

async function getBrowser() {
  if (browserInstance?.connected) {
    return browserInstance;
  }

  if (!browserLaunch) {
    browserLaunch = puppeteer.launch({ headless: true });
  }

  try {
    const browser = await browserLaunch;
    browserInstance = browser;
    browser.once("disconnected", () => {
      if (browserInstance === browser) {
        browserInstance = null;
      }
    });
    return browser;
  } finally {
    browserLaunch = null;
  }
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}
