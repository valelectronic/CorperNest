import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rentRecord, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { rentRecordId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { rentRecordId } = body;
  if (!rentRecordId)
    return NextResponse.json({ error: "rentRecordId is required" }, { status: 400 });

  const rows = await db
    .select({
      id:          rentRecord.id,
      renterId:    rentRecord.renterId,
      listingId:   rentRecord.listingId,
      rentAmount:  rentRecord.rentAmount,
      renewalDate: rentRecord.renewalDate,
      feePaid:     rentRecord.feePaid,
      receiptStatus: rentRecord.receiptStatus,
    })
    .from(rentRecord)
    .where(eq(rentRecord.id, rentRecordId))
    .limit(1);

  if (!rows.length)
    return NextResponse.json({ error: "Rent record not found" }, { status: 404 });

  const record = rows[0];

  if (!record.feePaid)
    return NextResponse.json({ error: "Fee not yet paid" }, { status: 400 });

  if (record.receiptStatus === "approved")
    return NextResponse.json({ error: "Already approved" }, { status: 400 });

  // Approve
  await db
    .update(rentRecord)
    .set({ receiptStatus: "approved", adminNote: null, updatedAt: new Date() })
    .where(eq(rentRecord.id, rentRecordId));

  // Notify client
  const renewalDateStr = new Date(record.renewalDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  await createNotification({
    userId:  record.renterId,
    type:    "receipt-approved",
    title:   "Rent receipt approved ✓",
    message: `Your rent payment receipt has been verified. Record is now official. Renewal due ${renewalDateStr}.`,
    link:    "/bookings",
  });

  return NextResponse.json({ success: true });
}