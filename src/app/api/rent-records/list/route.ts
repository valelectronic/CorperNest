import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rentRecord, listing } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const rows = await db
    .select({
      id:             rentRecord.id,
      bookingId:      rentRecord.bookingId,
      rentAmount:     rentRecord.rentAmount,
      durationMonths: rentRecord.durationMonths,
      paymentDate:    rentRecord.paymentDate,
      renewalDate:    rentRecord.renewalDate,
      receiptUrl:     rentRecord.receiptUrl,
      feePaid:        rentRecord.feePaid,
      receiptStatus:  rentRecord.receiptStatus,
      adminNote:      rentRecord.adminNote,
      reminderSent:   rentRecord.reminderSent,
      createdAt:      rentRecord.createdAt,
      renterId:       rentRecord.renterId,
      agentId:        rentRecord.agentId,
      listingTitle:   listing.title,
      listingAddress: listing.address,
      listingLga:     listing.lga,
    })
    .from(rentRecord)
    .innerJoin(listing, eq(rentRecord.listingId, listing.id))
    .where(or(eq(rentRecord.renterId, userId), eq(rentRecord.agentId, userId)));

  // Fire renewal reminders only for approved records expiring within 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const needsReminder = rows.filter(
    (r) =>
      r.feePaid &&
      r.receiptStatus === "approved" &&
      !r.reminderSent &&
      r.renterId === userId &&
      new Date(r.renewalDate) <= thirtyDaysFromNow
  );

  if (needsReminder.length > 0) {
    Promise.all(
      needsReminder.map(async (r) => {
        const { createNotification } = await import("@/lib/create-notification");
        const renewalDateStr = new Date(r.renewalDate).toLocaleDateString("en-NG", {
          day: "numeric", month: "long", year: "numeric",
        });
        await createNotification({
          userId:  r.renterId,
          type:    "rent-renewal-reminder",
          title:   "Rent renewal coming up",
          message: `Your rent for ${r.listingTitle} is due for renewal on ${renewalDateStr}. Start planning early.`,
          link:    "/bookings",
        });
        await db
          .update(rentRecord)
          .set({ reminderSent: true, updatedAt: new Date() })
          .where(eq(rentRecord.id, r.id));
      })
    ).catch((err) => console.error("[rent-records/list] reminder error:", err));
  }

  return NextResponse.json({ rentRecords: rows });
}