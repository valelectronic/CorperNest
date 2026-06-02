// src/app/api/payments/verify/[reference]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { inspectionPayment, booking } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reference } = await params;

  if (!reference) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  // ── 2. Find the payment — must belong to this user ────────────────────────
  const paymentResult = await db
    .select({ id: inspectionPayment.id, status: inspectionPayment.status, renterId: inspectionPayment.renterId })
    .from(inspectionPayment)
    .where(eq(inspectionPayment.paystackRef, reference))
    .limit(1);

  if (paymentResult.length === 0) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const payment = paymentResult[0];

  // Ensure this payment belongs to the logged-in user
  if (payment.renterId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ── 3. If not yet paid, verify directly with Paystack ─────────────────────
  // Webhook may not have fired yet — this is the fallback
  if (payment.status !== "paid") {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || paystackData.data?.status !== "success") {
      return NextResponse.json({ paid: false, bookingId: null });
    }

    // Validate amount
    if (paystackData.data.amount !== 500000) {
      return NextResponse.json({ paid: false, bookingId: null });
    }

    // Payment confirmed by Paystack but webhook hasn't fired yet
    // Return paid: true — the webhook will create the booking shortly
    return NextResponse.json({ paid: true, bookingId: null, pending: true });
  }

  // ── 4. Payment is paid — find the booking ─────────────────────────────────
  const bookingResult = await db
    .select({ id: booking.id })
    .from(booking)
    .where(eq(booking.inspectionPaymentId, payment.id))
    .limit(1);

  return NextResponse.json({
    paid:      true,
    bookingId: bookingResult[0]?.id ?? null,
  });
}