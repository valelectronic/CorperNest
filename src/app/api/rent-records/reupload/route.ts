import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rentRecord } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { rentRecordId?: string; receiptUrl?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { rentRecordId, receiptUrl } = body;
  if (!rentRecordId || !receiptUrl)
    return NextResponse.json({ error: "rentRecordId and receiptUrl are required" }, { status: 400 });

  // Must belong to this client and be flagged
  const rows = await db
    .select({
      id:            rentRecord.id,
      receiptStatus: rentRecord.receiptStatus,
      feePaid:       rentRecord.feePaid,
    })
    .from(rentRecord)
    .where(and(eq(rentRecord.id, rentRecordId), eq(rentRecord.renterId, session.user.id)))
    .limit(1);

  if (!rows.length)
    return NextResponse.json({ error: "Record not found" }, { status: 404 });

  const record = rows[0];

  if (record.receiptStatus !== "flagged")
    return NextResponse.json({ error: "Only flagged records can be re-uploaded" }, { status: 400 });

  if (!record.feePaid)
    return NextResponse.json({ error: "Fee not paid" }, { status: 400 });

  // Reset to pending with new receipt — no charge
  await db
    .update(rentRecord)
    .set({
      receiptUrl,
      receiptStatus: "pending",
      adminNote:     null,
      updatedAt:     new Date(),
    })
    .where(eq(rentRecord.id, rentRecordId));

  return NextResponse.json({ success: true });
}