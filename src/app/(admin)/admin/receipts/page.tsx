import { db } from "@/lib/db";
import { rentRecord, user, listing } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AdminReceiptsClient from "./receipts-client";

export const revalidate = 30;

async function getReceipts() {
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
      createdAt:      rentRecord.createdAt,
      renterName:     user.name,
      renterEmail:    user.email,
      listingTitle:   listing.title,
      listingLga:     listing.lga,
    })
    .from(rentRecord)
    .innerJoin(user,    eq(rentRecord.renterId,  user.id))
    .innerJoin(listing, eq(rentRecord.listingId, listing.id))
    .where(eq(rentRecord.feePaid, true))
    .orderBy(desc(rentRecord.createdAt));

  return rows;
}

export default async function AdminReceiptsPage() {
  const receipts = await getReceipts();
  return <AdminReceiptsClient receipts={receipts} />;
}