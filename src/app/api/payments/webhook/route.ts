// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inspectionPayment, booking, listing, rentRecord, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createHmac } from "crypto";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export const dynamic = "force-dynamic";

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BK-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const expectedSig = createHmac("sha512", secret).update(rawBody).digest("hex");

  if (signature !== expectedSig) {
    console.error("[webhook] Signature mismatch — possible fake event");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event: string;
    data: {
      reference: string;
      amount: number;
      status: string;
      metadata?: { type?: string; rentRecordId?: string; bookingId?: string };
      customer: { email: string };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, status, metadata } = event.data;

  if (status !== "success") {
    return NextResponse.json({ received: true });
  }

  // ── Route by metadata type ─────────────────────────────────────────────
  // Rent record fee payments carry metadata.type === "rent_record".
  // Everything else is treated as an inspection payment.
  if (metadata?.type === "rent_record") {
    return handleRentRecord(reference, amount, event.data.customer.email);
  }

  return handleInspectionPayment(reference, amount, event.data.customer.email);
}

// ─── INSPECTION PAYMENT HANDLER ───────────────────────────────────────────

async function handleInspectionPayment(reference: string, amount: number, customerEmail: string) {
  if (amount !== 500000) {
    console.error(`[webhook] Inspection amount mismatch: expected 500000, got ${amount}`);
    return NextResponse.json({ received: true });
  }

  const paymentResult = await db
    .select()
    .from(inspectionPayment)
    .where(eq(inspectionPayment.paystackRef, reference))
    .limit(1);

  if (paymentResult.length === 0) {
    console.error(`[webhook] No inspection payment found for reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  const payment = paymentResult[0];

  if (payment.status === "paid") {
    const existingBooking = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.inspectionPaymentId, payment.id))
      .limit(1);

    if (existingBooking.length > 0) {
      return NextResponse.json({ received: true });
    }
  }

  let listingResult: { id: string; title: string; agentId: string }[];

  if (payment.listingId) {
    listingResult = await db
      .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
      .from(listing)
      .where(eq(listing.id, payment.listingId))
      .limit(1);
  } else {
    listingResult = await db
      .select({ id: listing.id, title: listing.title, agentId: listing.agentId })
      .from(listing)
      .where(
        and(
          eq(listing.agentId, payment.agentId),
          eq(listing.status, "available"),
          eq(listing.isActive, true)
        )
      )
      .limit(1);
  }

  await db
    .update(inspectionPayment)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(inspectionPayment.id, payment.id));

  if (listingResult.length > 0) {
    const theListing = listingResult[0];
    const bookingId = nanoid();
    const bookingCode = generateBookingCode();

    await db.insert(booking).values({
      id: bookingId,
      listingId: theListing.id,
      renterId: payment.renterId,
      agentId: payment.agentId,
      inspectionPaymentId: payment.id,
      bookingCode,
      renterContact: customerEmail,
      renterContactType: "email",
      status: "pending",
      confirmationStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db
      .update(listing)
      .set({ status: "reserved", lastStatusUpdate: new Date(), updatedAt: new Date() })
      .where(eq(listing.id, theListing.id));

    await createNotification({
      userId: payment.agentId,
      type: "booking-created",
      title: "New Inspection Booked!",
      message: `A corper just paid to inspect your ${theListing.title}. Check your bookings.`,
      link: "/agent",
    });

    const [agentRow, renterRow] = await Promise.all([
      db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, payment.agentId)).limit(1),
      db.select({ name: user.name, phoneNumber: user.phoneNumber, phone: user.phone })
        .from(user).where(eq(user.id, payment.renterId)).limit(1),
    ]);
    const agentPhone = agentRow[0]?.phoneNumber ?? agentRow[0]?.phone ?? "Not provided";
    const renterPhone = renterRow[0]?.phoneNumber ?? renterRow[0]?.phone ?? "Not provided";

    await sendAdminEmail(
      `New Booking — ${bookingCode}`,
      `
        <h2>New Inspection Booking</h2>
        <table cellpadding="6">
          <tr><td><b>Booking Code</b></td><td>${bookingCode}</td></tr>
          <tr><td><b>Renter Name</b></td><td>${renterRow[0]?.name ?? "Unknown"}</td></tr>
          <tr><td><b>Renter Phone</b></td><td>${renterPhone}</td></tr>
          <tr><td><b>Renter Email</b></td><td>${customerEmail}</td></tr>
          <tr><td><b>Agent Name</b></td><td>${agentRow[0]?.name ?? "Unknown"}</td></tr>
          <tr><td><b>Agent Phone</b></td><td>${agentPhone}</td></tr>
          <tr><td><b>Listing</b></td><td>${theListing.title}</td></tr>
          <tr><td><b>Amount Paid</b></td><td>₦5,000</td></tr>
          <tr><td><b>Time</b></td><td>${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</td></tr>
        </table>
        <p><a href="https://www.corpernest.com.ng/admin/bookings">View on Admin Dashboard →</a></p>
      `
    );
  }

  return NextResponse.json({ received: true });
}

// ─── RENT RECORD HANDLER ──────────────────────────────────────────────────

async function handleRentRecord(reference: string, amount: number, customerEmail: string) {
  if (amount !== 100000) {
    console.error(`[webhook] Rent record amount mismatch: expected 100000, got ${amount}`);
    return NextResponse.json({ received: true });
  }

  const rows = await db
    .select()
    .from(rentRecord)
    .where(eq(rentRecord.paystackRef, reference))
    .limit(1);

  if (!rows.length) return NextResponse.json({ received: true });

  const record = rows[0];
  if (record.feePaid) return NextResponse.json({ received: true });

  await db
    .update(rentRecord)
    .set({ feePaid: true, updatedAt: new Date() })
    .where(eq(rentRecord.id, record.id));

  const renewalDateStr = new Date(record.renewalDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  await createNotification({
    userId: record.renterId,
    type: "rent-record-confirmed",
    title: "Rent record saved ✓",
    message: `Your rent payment receipt has been recorded. Your renewal is due ${renewalDateStr}.`,
    link: "/bookings",
  });

  await createNotification({
    userId: record.agentId,
    type: "rent-record-created",
    title: "Client uploaded rent receipt",
    message: `A client has recorded their rent payment for your property. Renewal due ${renewalDateStr}.`,
    link: "/agent",
  });

  const renterRows = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, record.renterId))
    .limit(1);

  const renter = renterRows[0];

  sendAdminEmail(
    `Rent Record Uploaded — ₦${record.rentAmount.toLocaleString()}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">Rent Receipt Uploaded</h2>
        <p style="color:#7A9A7A;margin:0 0 24px;font-size:13px">₦1,000 documentation fee paid</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Client</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${renter?.name ?? "—"} (${renter?.email ?? customerEmail})</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Rent Amount</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">₦${record.rentAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Duration</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${record.durationMonths} months</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Renewal Due</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9">${renewalDateStr}</td></tr>
          <tr><td style="padding:10px 0;color:#7A9A7A">Paystack Ref</td>
              <td style="padding:10px 0">${reference}</td></tr>
        </table>
        <a href="${record.receiptUrl}" target="_blank"
           style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
          View Receipt →
        </a>
      </div>
    `
  ).catch((err) => console.error("[webhook] Rent record admin email failed:", err));

  return NextResponse.json({ received: true });
}