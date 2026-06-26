import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  comments?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuoteRequestBody;

    const name = body.name?.trim();
    const phone = body.phone?.trim() || null;
    const email = body.email?.trim() || null;
    const zip = body.zip?.trim() || null;
    const projectCategory = body.projectCategory?.trim();
    const projectType = body.projectType?.trim() || null;
    const comments = body.comments?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 }
      );
    }

    if (!projectCategory) {
      return NextResponse.json(
        { error: "Project category is required." },
        { status: 400 }
      );
    }

    const notes = [
      "Website quote request",
      projectType ? `Project type: ${projectType}` : null,
      zip ? `ZIP code: ${zip}` : null,
      comments ? `Comments: ${comments}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        customer_name: name,
        phone,
        email,
        zip_code: zip,
        project_category: projectCategory,
        project_type: projectType,
        lead_source: "Website",
        status: "lead",
        priority: "normal",
        notes,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase quote insert error:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId: data.id,
    });
  } catch (err) {
    console.error("Quote request API error:", err);

    return NextResponse.json(
      { error: "Invalid quote request." },
      { status: 400 }
    );
  }
}