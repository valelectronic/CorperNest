// src/app/api/admin/kyc/decline/route.ts
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

  const { agentId, requestId, note } = await req.json();
  if (!agentId || !requestId || !note) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db
    .update(agentKycRequest)
    .set({ status: "declined", adminNote: note, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(agentKycRequest.id, requestId));

  await db
    .update(user)
    .set({ role: "user" })
    .where(eq(user.id, agentId));

  await createNotification({
    userId: agentId,
    type: "kyc-declined",
    title: "Verification request declined",
    message: `Your agent verification was declined. Reason: ${note}. You can resubmit with updated information.`,
    link: "/agent/kyc",
  });

  return NextResponse.json({ success: true });
}