// src/app/api/user/agent-status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ agentVerified: false });
  }

  const result = await db
    .select({ agentVerified: user.agentVerified, role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    agentVerified: result[0]?.agentVerified ?? false,
    role:          result[0]?.role ?? "user",
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}