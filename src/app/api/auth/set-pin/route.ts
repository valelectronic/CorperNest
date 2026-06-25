// src/app/api/auth/set-pin/route.ts
//
// Called right after signup verification succeeds. The account already has
// a throwaway password (set during signUpEmail), so setPassword won't work
// here — it only accepts truly passwordless accounts. We use changePassword
// instead, with the throwaway password bridged forward from the verify step.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { pin } = body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
  }

  // ── Look up the bridged throwaway password from signup ──────────────────
  const bridgeIdentifier = `pending-pin-bridge:${session.user.id}`;
  const bridge = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, bridgeIdentifier))
    .limit(1);

  try {
    if (bridge.length > 0) {
      // Fresh signup — account has the throwaway password. Use
      // changePassword, authorized by that known throwaway value.
      await auth.api.changePassword({
        body: {
          currentPassword: bridge[0].value,
          newPassword: pin,
        },
        headers: await headers(),
      });
      await db.delete(verification).where(eq(verification.identifier, bridgeIdentifier));
    } else {
      // Fallback — a genuinely passwordless account (shouldn't normally
      // happen with the current signup flow, but kept as a safety net).
      await auth.api.setPassword({
        body: { newPassword: pin },
        headers: await headers(),
      });
    }
  } catch (err) {
    console.error("[set-pin] Failed to set PIN:", err);
    return NextResponse.json({ error: "Could not save your PIN. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}