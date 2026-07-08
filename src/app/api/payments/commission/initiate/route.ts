// src/app/api/payments/commission/initiate/route.ts
//
// Initiates a ₦1,000 Paystack commission payment from an agent.
// Uses the same co-founder Paystack account as all other payments.
// On success, webhook handles marking the commission as paid.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const COMMISSION_AMOUNT = 100000; // ₦1,000 in kobo

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { bookingId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { bookingId } = body;
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const [found] = await db
    .select({
      id:               booking.id,
      agentId:          booking.agentId,
      commissionStatus: booking.commissionStatus,
      status:           booking.status,
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!found) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (found.agentId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (found.commissionStatus === "paid") {
    return NextResponse.json({ error: "Commission already paid" }, { status: 409 });
  }
  if (found.commissionStatus !== "requested") {
    return NextResponse.json({ error: "No commission request found" }, { status: 409 });
  }

  // Get agent email for Paystack
  const [agentRow] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agent`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email:        agentRow?.email ?? session.user.email,
      amount:       COMMISSION_AMOUNT,
      callback_url: callbackUrl,
      metadata: {
        type:      "commission",
        bookingId,
        agentId:   session.user.id,
        agentName: agentRow?.name ?? session.user.name,
      },
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackRes.ok || !paystackData.data?.authorization_url) {
    return NextResponse.json({ error: "Could not initialize payment" }, { status: 500 });
  }

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
  });
}