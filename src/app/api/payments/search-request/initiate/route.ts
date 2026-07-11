// src/app/api/payments/search-request/initiate/route.ts
//
// Initiates a ₦5,000 Paystack payment for a dedicated property search.
// On success, Paystack redirects back to /request-property?ref=xxx
// which the page verifies before showing the form.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const PAYSTACK_SECRET   = process.env.PAYSTACK_SECRET_KEY!;
const SEARCH_FEE_AMOUNT = 500000; // ₦5,000 in kobo

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userRow] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/request-property`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email:        userRow?.email ?? session.user.email,
      amount:       SEARCH_FEE_AMOUNT,
      callback_url: callbackUrl,
      metadata: {
        type:      "search_payment",
        userId:    session.user.id,
        userName:  userRow?.name ?? session.user.name,
      },
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.data?.authorization_url) {
    console.error("[search-request/initiate] Paystack error:", data);
    return NextResponse.json({ error: "Could not initialize payment" }, { status: 500 });
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference:        data.data.reference,
  });
}