import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rentRecord } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { rentRecordId?: string; reason?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { rentRecordId, reason } = body;
  if (!rentRecordId)
    return NextResponse.json({ error: "rentRecordId is required" }, { status: 400 });
  if (!reason || reason.trim().length < 5)
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });

  const rows = await db
    .select({
      id:            rentRecord.id,
      renterId:      rentRecord.renterId,
      receiptStatus: rentRecord.receiptStatus,
      feePaid:       rentRecord.feePaid,
      listingId:     rentRecord.listingId,
    })
    .from(rentRecord)
    .where(eq(rentRecord.id, rentRecordId))
    .limit(1);

  if (!rows.length)
    return NextResponse.json({ error: "Rent record not found" }, { status: 404 });

  const record = rows[0];

  if (!record.feePaid)
    return NextResponse.json({ error: "Fee not yet paid" }, { status: 400 });

  // Flag — client can re-upload without paying again
  await db
    .update(rentRecord)
    .set({
      receiptStatus: "flagged",
      adminNote:     reason.trim(),
      updatedAt:     new Date(),
    })
    .where(eq(rentRecord.id, rentRecordId));

  // Notify client — tell them exactly what's wrong and that they can fix it free
  await createNotification({
    userId:  record.renterId,
    type:    "receipt-flagged",
    title:   "Receipt needs updating",
    message: `Your rent receipt was flagged: "${reason.trim()}". You can re-upload a correct receipt at no extra charge.`,
    link:    "/bookings",
  });

  return NextResponse.json({ success: true });
}