// src/app/api/agent/kyc/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { agentKycRequest, user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendAdminEmail } from "@/lib/send-admin-email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ← REMOVE the role !== "agent" check entirely
  // Any logged-in user can submit KYC

  const existingUser = await db
    .select({ agentVerified: userTable.agentVerified })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (existingUser[0]?.agentVerified) {
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

  if (!fullName || !phone || !state || !lga || !bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  if (!/^\d{10}$/.test(accountNumber.trim())) {
    return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
  }

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

  // ← THE FIX: set role=agent on every submit (insert or resubmit)
  await db
    .update(userTable)
    .set({ role: "agent" })
    .where(eq(userTable.id, session.user.id));

    // Admin email alert — new KYC submission
await sendAdminEmail(
  `New KYC Request — ${fullName}`,
  `
    <h2>Agent KYC Submission</h2>
    <table cellpadding="6">
      <tr><td><b>Name</b></td><td>${fullName}</td></tr>
      <tr><td><b>Email</b></td><td>${session.user.email}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone.trim()}</td></tr>
      <tr><td><b>WhatsApp</b></td><td>${whatsapp?.trim() || "—"}</td></tr>
      <tr><td><b>State</b></td><td>${state}</td></tr>
      <tr><td><b>LGA</b></td><td>${lga}</td></tr>
      <tr><td><b>Bank</b></td><td>${bankName}</td></tr>
      <tr><td><b>Account Number</b></td><td>${accountNumber.trim()}</td></tr>
      <tr><td><b>Account Name</b></td><td>${accountName.trim()}</td></tr>
      <tr><td><b>Submitted</b></td><td>${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
    </table>
    <p><a href="https://www.corpernest.com.ng/admin/kyc">Review on Admin Dashboard →</a></p>
  `
);

return NextResponse.json({ success: true });
}