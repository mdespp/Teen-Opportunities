import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { saveNewsletterSignup } from "@/lib/newsletter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = sanitizeEmailInput(String(body?.email || ""));

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    const result = await saveNewsletterSignup({
      email,
      source: "site_newsletter",
    });

    if (!result.saved) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        savedEmail: email,
        message: "Your email has been added.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to save newsletter signup:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save newsletter signup.",
      },
      { status: 500 }
    );
  }
}