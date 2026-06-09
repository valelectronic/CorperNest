// src/app/api/agent/kyc/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { agentKycRequest } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string | null; agentVerified?: boolean | null };

  if (user.role !== "agent") {
    return NextResponse.json({ error: "Only agents can submit KYC" }, { status: 403 });
  }

  if (user.agentVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  // Check for existing pending/approved submission
  const existing = await db
    .select({ id: agentKycRequest.id, status: agentKycRequest.status })
    .from(agentKycRequest)
    .where(eq(agentKycRequest.agentId, session.user.id))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "pending") {
    return NextResponse.json({ error: "You already have a pending KYC request" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { fullName, phone, whatsapp, state, lga, bankName, accountNumber, accountName } = body as {
    fullName:      string;
    phone:         string;
    whatsapp?:     string;
    state:         string;
    lga:           string;
    bankName:      string;
    accountNumber: string;
    accountName:   string;
  };

  // Validate required fields
  if (!fullName || !phone || !state || !lga || !bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  // Validate account number is digits only
  if (!/^\d{10}$/.test(accountNumber.trim())) {
    return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
  }

  // If declined before, create new request (allow resubmission)
  if (existing.length > 0 && existing[0].status === "declined") {
    await db
      .update(agentKycRequest)
      .set({
        fullName,
        phone:         phone.trim(),
        whatsapp:      whatsapp?.trim() || null,
        state,
        lga,
        bankName,
        accountNumber: accountNumber.trim(),
        accountName:   accountName.trim(),
        status:        "pending",
        adminNote:     null,
        reviewedAt:    null,
        updatedAt:     new Date(),
      })
      .where(eq(agentKycRequest.agentId, session.user.id));
  } else {
    await db.insert(agentKycRequest).values({
      id:            nanoid(),
      agentId:       session.user.id,
      fullName,
      phone:         phone.trim(),
      whatsapp:      whatsapp?.trim() || null,
      state,
      lga,
      bankName,
      accountNumber: accountNumber.trim(),
      accountName:   accountName.trim(),
      status:        "pending",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    });

    
  }

  return NextResponse.json({ success: true });
}