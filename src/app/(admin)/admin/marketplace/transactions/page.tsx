// src/app/admin/marketplace/transactions/page.tsx
import { db } from "@/lib/db";
import { marketplaceTransaction, marketplaceListing, user } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import AdminTransactionsClient from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const rows = await db
    .select({
      id:           marketplaceTransaction.id,
      listingId:    marketplaceTransaction.listingId,
      buyerId:      marketplaceTransaction.buyerId,
      sellerId:     marketplaceTransaction.sellerId,
      amount:       marketplaceTransaction.amount,
      commission:   marketplaceTransaction.commission,
      sellerPayout: marketplaceTransaction.sellerPayout,
      status:       marketplaceTransaction.status,
      paystackRef:  marketplaceTransaction.paystackRef,
      paidAt:       marketplaceTransaction.paidAt,
      confirmedAt:  marketplaceTransaction.confirmedAt,
      releasedAt:   marketplaceTransaction.releasedAt,
      listingTitle: marketplaceListing.title,
      sellerName:   user.name,
      sellerPhone:  user.phoneNumber,
    })
    .from(marketplaceTransaction)
    .innerJoin(marketplaceListing, eq(marketplaceTransaction.listingId, marketplaceListing.id))
    .innerJoin(user, eq(marketplaceTransaction.sellerId, user.id))
    .orderBy(desc(marketplaceTransaction.createdAt))
    .catch(() => []);

  // Fetch buyer details
  const buyerIds = [...new Set(rows.map((r) => r.buyerId))];
  const buyers   = buyerIds.length > 0
    ? await db.select({ id: user.id, name: user.name, phone: user.phoneNumber })
        .from(user).where(inArray(user.id, buyerIds)).catch(() => [])
    : [];
  const buyerMap = Object.fromEntries(buyers.map((b) => [b.id, b]));

  const txns = rows.map((r) => ({
    ...r,
    amount:       r.amount       / 100,
    commission:   r.commission   / 100,
    sellerPayout: r.sellerPayout / 100,
    buyerName:    buyerMap[r.buyerId]?.name  ?? null,
    buyerPhone:   buyerMap[r.buyerId]?.phone ?? null,
  }));

  return <AdminTransactionsClient transactions={txns} />;
}