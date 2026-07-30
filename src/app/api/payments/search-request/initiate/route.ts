// src/app/api/payments/search-request/initiate/route.ts
// Initiates a ₦5,000 Paystack payment for dedicated property search.
// Paystack redirects back to /request-property?reference=xxx on success.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const PAYSTACK_SECRET   = process.env.PAYSTACK_SECRET_KEY!;
const SEARCH_FEE_AMOUNT = 500000; // ₦5,000 in kobo

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  // Use session email directly — no extra DB query needed
  const email = session.user.email!;
  const name  = session.user.name  ?? "";

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/request-property`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount:       SEARCH_FEE_AMOUNT,
      callback_url: callbackUrl,
      metadata: {
        type:     "search_payment",
        userId:   session.user.id,
        userName: name,
      },
    }),
  });

  const data = await paystackRes.json();

  if (!paystackRes.ok || !data.data?.authorization_url) {
    return NextResponse.json({ error: "Could not initialize payment. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference:        data.data.reference,
  });
}