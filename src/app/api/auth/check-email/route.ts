import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
console.log("[check-email] checking:", email); 
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.toLowerCase().trim()))
    .limit(1);

    console.log("[check-email] result:", existing.length);
  return NextResponse.json({ exists: existing.length > 0 });
}