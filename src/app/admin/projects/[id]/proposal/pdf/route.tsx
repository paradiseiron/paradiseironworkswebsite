import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
  const proposalUrl = `${origin}/admin/projects/${id}/proposal?pdf=1`;

  const cookieHeader = request.headers.get("cookie") || "";

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      cookie: cookieHeader,
    });

    await page.goto(proposalUrl, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
  format: "Letter",
  printBackground: true,
  margin: {
    top: "0.4in",
    right: "0.4in",
    bottom: "0.4in",
    left: "0.4in",
  },
});

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${
          project.proposal_number || "proposal"
        }.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}