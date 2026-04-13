import { NextResponse } from "next/server";
import { getAllOpportunities } from "@/lib/opportunities";

export async function GET() {
  try {
    const opportunities = await getAllOpportunities();

    return NextResponse.json(
      {
        opportunities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch opportunities",
      },
      { status: 500 }
    );
  }
}