import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const headersList = await headers();
  
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();

  if (role !== "user" && role !== "agent") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await db
    .update(user)
    .set({ role })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}