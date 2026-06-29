// src/app/api/auth/custom-signup/start/route.ts
//
// Step 1 of custom signup: validates phone/email aren't already taken,
// generates an OTP, tries SMS first, falls back to email automatically.
// Does NOT create the account yet — that happens in /verify once the
// code is confirmed correct.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, verification } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { sendOTP } from "@/lib/otp-sender";
import { nanoid } from "nanoid";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  let body: { name?: string; phone?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, phone, email } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!phone || !/^0\d{10}$/.test(phone.trim())) {
    return NextResponse.json({ error: "Enter a valid Nigerian phone number (e.g. 08012345678)" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const normalisedEmail = email.trim().toLowerCase();
  const normalisedPhone = phone.trim();

  // ── Duplicate check — before any OTP is ever sent ──────────────────────
  const existing = await db
    .select({ email: user.email, phoneNumber: user.phoneNumber })
    .from(user)
    .where(or(eq(user.email, normalisedEmail), eq(user.phoneNumber, normalisedPhone)))
    .limit(1);

  if (existing.length > 0) {
    const match = existing[0];
    if (match.email === normalisedEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 }
      );
    }
    if (match.phoneNumber === normalisedPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Sign in instead." },
        { status: 409 }
      );
    }
  }

  // ── Generate code, try SMS first, fall back to email automatically ─────
  const code = generateCode();
  const identifier = `custom-signup:${normalisedEmail}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes — matches Termii's approved SMS sample exactly

  // Clear any previous pending signup attempt for this email
  await db.delete(verification).where(eq(verification.identifier, identifier));

  await db.insert(verification).values({
    id: nanoid(),
    identifier,
    // Store everything needed to create the account once verified
    value: JSON.stringify({ code, name: name.trim(), phone: normalisedPhone, email: normalisedEmail }),
    expiresAt,
    createdAt: new Date(),
  });

  const result = await sendOTP({
    to: normalisedEmail,
    phone: normalisedPhone,
    code,
    type: "email-verification",
  });

  // Update the stored record with the actual channel used, so the verify
  // step knows whether to mark the phone as genuinely verified or not.
  await db
    .update(verification)
    .set({
      value: JSON.stringify({
        code,
        name: name.trim(),
        phone: normalisedPhone,
        email: normalisedEmail,
        channel: result.channel,
      }),
    })
    .where(eq(verification.identifier, identifier));

  return NextResponse.json({
    success: true,
    channel: result.channel, // "sms" or "email" — frontend shows the right message
    email: normalisedEmail,
  });
}