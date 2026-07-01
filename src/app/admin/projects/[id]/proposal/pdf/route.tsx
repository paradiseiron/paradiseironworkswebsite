import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
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
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ cookie: cookieHeader });
    }

    const response = await page.goto(proposalUrl, {
      waitUntil: "networkidle0",
    });

    if (!response?.ok()) {
      throw new Error(
        `Proposal preview returned ${response?.status() ?? "no response"}`
      );
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
    await browser.close();
  }
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}
