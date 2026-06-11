
// src/app/api/admin/kyc/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentKycRequest, user } from "@/db/schema";
import { createNotification } from "@/lib/create-notification";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, requestId } = await req.json();
  if (!agentId || !requestId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db
    .update(agentKycRequest)
    .set({ status: "approved", reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(agentKycRequest.id, requestId));

  await db
    .update(user)
    .set({ agentVerified: true })
    .where(eq(user.id, agentId));

  await createNotification({
    userId: agentId,
    type: "agent-verified",
    title: "You're a verified agent! 🎉",
    message: "Your identity has been verified. You can now list properties and receive bookings on CorperNest.",
    link: "/agent",
  });

  return NextResponse.json({ success: true });
}