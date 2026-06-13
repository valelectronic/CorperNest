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

  // Return records where user is either the renter or the agent
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

  // Check for upcoming renewals — fire reminder if within 30 days and not yet sent
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const needsReminder = rows.filter(
    (r) =>
      r.feePaid &&
      !r.reminderSent &&
      r.renterId === userId &&
      new Date(r.renewalDate) <= thirtyDaysFromNow
  );

  // Fire renewal notifications — don't await, non-blocking
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