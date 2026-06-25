// src/app/api/auth/custom-signup/verify/route.ts
//
// Step 2 of custom signup: checks the code against what was stored in
// step 1, and if correct, creates the account using Better Auth's own
// standard signUpEmail method — the same trusted mechanism your app
// already uses today. A random throwaway password is used here; the
// user sets their real PIN in the very next screen via setPassword.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verification, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, code } = body;
  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  const normalisedEmail = email.trim().toLowerCase();
  const identifier = `custom-signup:${normalisedEmail}`;

  const found = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);

  if (found.length === 0) {
    return NextResponse.json({ error: "No pending signup found. Please start again." }, { status: 404 });
  }

  const record = found[0];

  if (new Date(record.expiresAt) < new Date()) {
    await db.delete(verification).where(eq(verification.identifier, identifier));
    return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 410 });
  }

  let stored: { code: string; name: string; phone: string; email: string; channel: "sms" | "email" };
  try {
    stored = JSON.parse(record.value);
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please start again." }, { status: 500 });
  }

  if (stored.code !== code.trim()) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  // ── Create the account via Better Auth's own standard method ───────────
  // A random throwaway password satisfies the required field — the user
  // never sees or uses it. They set their real PIN in the next step.
  // NOTE: the pending record is deleted only AFTER this succeeds — if
  // account creation fails for any reason, the user can retry the same
  // code immediately instead of being stuck with nothing to check against.
  const throwawayPassword = nanoid(32);

  const signUpResult = await auth.api.signUpEmail({
    body: {
      email: stored.email,
      password: throwawayPassword,
      name: stored.name,
    },
    asResponse: true,
  });

  if (!signUpResult.ok) {
    const errData = await signUpResult.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message ?? "Could not create account. Please try again." },
      { status: signUpResult.status }
    );
  }

  // Account created successfully — now safe to clean up the pending record
  await db.delete(verification).where(eq(verification.identifier, identifier));

  // ── Bridge the throwaway password forward to /set-pin ───────────────────
  // setPassword only works on accounts with NO password yet — but
  // signUpEmail just set one (the throwaway). The correct tool now is
  // changePassword, which needs the CURRENT password to authorize the
  // change. We generated that password, so we know it — we just need to
  // hand it to the next step securely, server-side only, short-lived.
  //
  // Looking the user up by email directly (rather than parsing it out of
  // signUpResult's response body) avoids any uncertainty about the exact
  // shape Better Auth returns.
  const newUserRows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, stored.email))
    .limit(1);

  const newUserId = newUserRows[0]?.id;

  if (newUserId) {
    await db.insert(verification).values({
      id: nanoid(),
      identifier: `pending-pin-bridge:${newUserId}`,
      value: throwawayPassword,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(),
    });
    console.log("[custom-signup/verify] Bridge created for user:", newUserId);
  } else {
    console.error("[custom-signup/verify] Could not find newly created user by email:", stored.email);
  }

  // ── Persist phone number + verified flags ───────────────────────────────
  // Only mark the phone as verified if SMS was the channel that actually
  // delivered the code. If it fell back to email (e.g. Termii not approved
  // yet), we've only proven the email works — not the phone number.
  await db
    .update(user)
    .set({
      phoneNumber: stored.phone,
      phoneNumberVerified: stored.channel === "sms",
      emailVerified: true,
      phone: stored.phone, // keep legacy field in sync for now
    })
    .where(eq(user.email, stored.email));

  // Forward the session cookie Better Auth set, so the browser stays logged in
  const headers = new Headers();
  const setCookie = signUpResult.headers.get("set-cookie");
  if (setCookie) headers.set("set-cookie", setCookie);

  return NextResponse.json({ success: true }, { headers });
}