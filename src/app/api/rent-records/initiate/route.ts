import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { booking, rentRecord } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

const DOCUMENTATION_FEE_KOBO = 100000; // ₦1,000

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    bookingId?:     string;
    listingId?:     string;
    rentAmount?:    number;
    durationMonths?: number;
    paymentDate?:   string;
    receiptUrl?:    string;
  };

  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { bookingId, listingId, rentAmount, durationMonths, paymentDate, receiptUrl } = body;

  if (!bookingId || !listingId || !rentAmount || !durationMonths || !paymentDate || !receiptUrl)
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });

  if (![6, 12, 24].includes(durationMonths))
    return NextResponse.json({ error: "Duration must be 6, 12 or 24 months" }, { status: 400 });

  if (typeof rentAmount !== "number" || rentAmount <= 0)
    return NextResponse.json({ error: "Invalid rent amount" }, { status: 400 });

  // Verify booking belongs to this client and is verified
  const bookingRows = await db
    .select({ id: booking.id, agentId: booking.agentId, status: booking.status })
    .from(booking)
    .where(and(eq(booking.id, bookingId), eq(booking.renterId, session.user.id)))
    .limit(1);

  if (!bookingRows.length)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (bookingRows[0].status !== "verified")
    return NextResponse.json(
      { error: "You can only upload a receipt after your visit is verified" },
      { status: 400 }
    );

  // Check if rent record already exists for this booking
  const existing = await db
    .select({ id: rentRecord.id, feePaid: rentRecord.feePaid })
    .from(rentRecord)
    .where(eq(rentRecord.bookingId, bookingId))
    .limit(1);

  if (existing.length > 0 && existing[0].feePaid)
    return NextResponse.json(
      { error: "A rent record already exists for this booking" },
      { status: 409 }
    );

  // Calculate renewal date
  const paidDate   = new Date(paymentDate);
  const renewalDate = new Date(paidDate);
  renewalDate.setMonth(renewalDate.getMonth() + durationMonths);

  // Generate Paystack reference
  const paystackRef = `RNT-${nanoid(10).toUpperCase()}`;

  // Create pending rent record — will be confirmed after payment webhook
  const recordId = nanoid();
  await db.insert(rentRecord).values({
    id:             recordId,
    bookingId,
    renterId:       session.user.id,
    agentId:        bookingRows[0].agentId,
    listingId,
    rentAmount:     Math.round(rentAmount),
    durationMonths,
    paymentDate:    paidDate,
    renewalDate,
    receiptUrl,
    paystackRef,
    feePaid:        false,
    reminderSent:   false,
    createdAt:      new Date(),
    updatedAt:      new Date(),
  });

  // Initiate Paystack payment
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email:      session.user.email,
      amount:     DOCUMENTATION_FEE_KOBO,
      reference:  paystackRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?receipt=success&ref=${paystackRef}`,
      metadata: {
        type:       "rent_record",
        rentRecordId: recordId,
        bookingId,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status)
    return NextResponse.json(
      { error: "Could not initiate payment. Try again." },
      { status: 500 }
    );

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference:        paystackRef,
    rentRecordId:     recordId,
  });
}