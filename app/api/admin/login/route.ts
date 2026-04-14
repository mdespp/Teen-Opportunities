import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  isValidAdminPassword,
} from "@/lib/adminSession";

export async function POST(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const password = String(body?.password || "").trim();

  if (!password) {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400 }
    );
  }

  try {
    if (!isValidAdminPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    await createAdminSession();

    return NextResponse.json(
      { success: true, message: "Logged in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed admin login:", error);

    return NextResponse.json(
      { error: "Failed to log in." },
      { status: 500 }
    );
  }
}