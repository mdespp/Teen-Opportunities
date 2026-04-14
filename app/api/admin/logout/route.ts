import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/adminSession";

export async function POST() {
  try {
    await clearAdminSession();

    return NextResponse.json(
      { success: true, message: "Logged out." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed admin logout:", error);

    return NextResponse.json(
      { error: "Failed to log out." },
      { status: 500 }
    );
  }
}