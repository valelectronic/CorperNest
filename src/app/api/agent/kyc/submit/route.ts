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

  const existingUser = await db
    .select({ agentVerified: userTable.agentVerified })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (existingUser[0]?.agentVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

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

  // Bank details removed — commission is collected manually, no Paystack
  // payout to agents. We only need contact and location details now.
  const { fullName, phone, whatsapp, state, lga } = body as {
    fullName:  string;
    phone:     string;
    whatsapp?: string;
    state:     string;
    lga:       string;
  };

  if (!fullName || !phone || !state || !lga) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  // Shared values for both insert and update
  const kycData = {
    fullName,
    phone:         phone.trim(),
    whatsapp:      whatsapp?.trim() || null,
    state,
    lga,
    // Bank fields kept in schema for backward compat with old records
    // but sent as empty strings for new submissions
    bankName:      "",
    accountNumber: "",
    accountName:   "",
    status:        "pending" as const,
    adminNote:     null,
    reviewedAt:    null,
    updatedAt:     new Date(),
  };

  if (existing.length > 0 && existing[0].status === "declined") {
    await db
      .update(agentKycRequest)
      .set(kycData)
      .where(eq(agentKycRequest.agentId, session.user.id));
  } else {
    await db.insert(agentKycRequest).values({
      id:        nanoid(),
      agentId:   session.user.id,
      createdAt: new Date(),
      ...kycData,
    });
  }

  // Set role to agent on every submit
  await db
    .update(userTable)
    .set({ role: "agent" })
    .where(eq(userTable.id, session.user.id));

  // Admin email — no bank details since we collect commission manually
  await sendAdminEmail(
    `New KYC Request — ${fullName}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 20px">New Agent KYC Submission</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Name</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;font-weight:700">${fullName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Email</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${session.user.email}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Phone</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">
                <a href="tel:${phone.trim()}" style="color:#2E7D32;font-weight:700">${phone.trim()}</a>
              </td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">WhatsApp</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${whatsapp?.trim() || "—"}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">State</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${state}</td></tr>
          <tr><td style="padding:10px 0;color:#7A9A7A">LGA</td>
              <td style="padding:10px 0">${lga}</td></tr>
        </table>
        <p style="font-size:12px;color:#7A9A7A;margin:20px 0 0">
          Submitted ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
        </p>
        <a href="https://www.corpernest.com.ng/admin/agents"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
          Review on Admin Dashboard →
        </a>
      </div>
    `
  );

  return NextResponse.json({ success: true });
}