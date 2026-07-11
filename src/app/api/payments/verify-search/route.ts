// src/app/api/payments/verify-search/route.ts
//
// Verifies a ₦5,000 search payment ref with Paystack.
// Called by the request-property page on return from Paystack.
// Only succeeds if: paid, correct amount, same user email.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const PAYSTACK_SECRET   = process.env.PAYSTACK_SECRET_KEY!;
const SEARCH_FEE_AMOUNT = 500000; // ₦5,000 in kobo

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "No reference provided" }, { status: 400 });
  }

  // Verify with Paystack
  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await paystackRes.json();

  if (!paystackRes.ok || data.data?.status !== "success") {
    return NextResponse.json({ error: "Payment not successful", verified: false }, { status: 400 });
  }

  // Confirm correct amount
  if (data.data.amount !== SEARCH_FEE_AMOUNT) {
    return NextResponse.json({ error: "Incorrect payment amount", verified: false }, { status: 400 });
  }

  // Confirm it's a search payment
  if (data.data.metadata?.type !== "search_payment") {
    return NextResponse.json({ error: "Wrong payment type", verified: false }, { status: 400 });
  }

  // Confirm the user who paid is the current session user
  const [userRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (data.data.customer?.email !== userRow?.email) {
    return NextResponse.json({ error: "Payment does not match your account", verified: false }, { status: 403 });
  }

  return NextResponse.json({ verified: true, ref });
}