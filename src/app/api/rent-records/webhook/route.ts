import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rentRecord, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";
import { createNotification } from "@/lib/create-notification";
import { sendAdminEmail } from "@/lib/send-admin-email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });

  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: {
    event: string;
    data: {
      reference: string;
      amount:    number;
      status:    string;
      metadata?: { type?: string; rentRecordId?: string; bookingId?: string };
      customer:  { email: string };
    };
  };

  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success")
    return NextResponse.json({ received: true });

  const { reference, amount, status, metadata } = event.data;

  if (status !== "success")
    return NextResponse.json({ received: true });

  // Only handle rent record payments
  if (metadata?.type !== "rent_record")
    return NextResponse.json({ received: true });

  if (amount !== 100000)
    return NextResponse.json({ received: true });

  // Find the rent record
  const rows = await db
    .select()
    .from(rentRecord)
    .where(eq(rentRecord.paystackRef, reference))
    .limit(1);

  if (!rows.length)
    return NextResponse.json({ received: true });

  const record = rows[0];

  // Idempotency
  if (record.feePaid)
    return NextResponse.json({ received: true });

  // Mark as paid
  await db
    .update(rentRecord)
    .set({ feePaid: true, updatedAt: new Date() })
    .where(eq(rentRecord.id, record.id));

  // Notify client
  const renewalDateStr = new Date(record.renewalDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  await createNotification({
    userId:  record.renterId,
    type:    "rent-record-confirmed",
    title:   "Rent record saved ✓",
    message: `Your rent payment receipt has been recorded. Your renewal is due ${renewalDateStr}.`,
    link:    "/bookings",
  });

  // Notify agent
  await createNotification({
    userId:  record.agentId,
    type:    "rent-record-created",
    title:   "Client uploaded rent receipt",
    message: `A client has recorded their rent payment for your property. Renewal due ${renewalDateStr}.`,
    link:    "/agent",
  });

  // Fetch renter name for admin email
  const renterRows = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, record.renterId))
    .limit(1);

  const renter = renterRows[0];

  // Admin email
  sendAdminEmail(
    `Rent Record Uploaded — ₦${record.rentAmount.toLocaleString()}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1B2E1B;margin:0 0 4px">Rent Receipt Uploaded</h2>
        <p style="color:#7A9A7A;margin:0 0 24px;font-size:13px">₦1,000 documentation fee paid</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A;width:140px">Client</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${renter?.name ?? "—"} (${renter?.email ?? "—"})</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Rent Amount</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">₦${record.rentAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Duration</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${record.durationMonths} months</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#7A9A7A">Renewal Due</td>
              <td style="padding:10px 0;border-bottom:1px solid #E8F5E9;color:#1B1B1B">${renewalDateStr}</td></tr>
          <tr><td style="padding:10px 0;color:#7A9A7A">Paystack Ref</td>
              <td style="padding:10px 0;color:#1B1B1B">${reference}</td></tr>
        </table>
        <a href="${record.receiptUrl}" target="_blank"
           style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2E7D32;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
          View Receipt →
        </a>
      </div>
    `
  ).catch((err) => console.error("[rent-record webhook] admin email failed:", err));

  return NextResponse.json({ received: true });
}