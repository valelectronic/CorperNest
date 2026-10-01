// src/app/api/parkout/ambassador/apply/init-payment/route.ts
// Step 1 of ambassador application — initializes ₦2,000 vetting fee payment.
//
// Flow:
// 1. Check user is logged in
// 2. Check no existing application (prevent double payment)
// 3. Create parkoutAmbassadorApplication with status: pending_payment
// 4. Initialize Paystack payment for ₦2,000
// 5. Return authorizationUrl → client redirects to Paystack
//
// After payment: Paystack webhook fires → updates application to fee_paid
// fee_paid status → unlocks the application form on the client

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassadorApplication } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL ?? "https://corpernest.com.ng";
const VETTING_FEE     = 200000; // ₦2,000 in kobo

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { email } = await req.json();

  // ── Check for existing application ────────────────────────────────────────
  const [existing] = await db
    .select({ id: parkoutAmbassadorApplication.id, status: parkoutAmbassadorApplication.status })
    .from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.userId, session.user.id))
    .limit(1);

  // If already paid or submitted — do not allow duplicate payment
  if (existing && existing.status !== "pending_payment") {
    return NextResponse.json(
      { error: "You already have an active application." },
      { status: 400 }
    );
  }

  // ── Create application record (or reuse pending one) ──────────────────────
  let applicationId: string;

  if (existing?.status === "pending_payment") {
    // Reuse existing pending application — do not create duplicate
    applicationId = existing.id;
  } else {
    // Create new application record
    applicationId = `amb_app_${nanoid(10)}`;
    await db.insert(parkoutAmbassadorApplication).values({
      id:     applicationId,
      userId: session.user.id,
      status: "pending_payment",
    });
  }

  // ── Initialize Paystack payment ───────────────────────────────────────────
  const paystackRef   = `amb_${nanoid(12)}`;
  const callbackUrl   = `${APP_URL}/parkout/ambassador/apply?payment=success&ref=${paystackRef}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${PAYSTACK_SECRET}`,
    },
    body: JSON.stringify({
      email:        email || session.user.email,
      amount:       VETTING_FEE,
      reference:    paystackRef,
      callback_url: callbackUrl,
      metadata: {
        type:          "parkout_ambassador_vetting",  // webhook routes by this
        applicationId,
        userId:        session.user.id,
        userName:      session.user.name ?? "Applicant",
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.data?.authorization_url) {
    console.error("[ambassador/init-payment] Paystack error:", paystackData);
    return NextResponse.json(
      { error: "Could not initialize payment. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    applicationId,
    reference:        paystackRef,
  });
}