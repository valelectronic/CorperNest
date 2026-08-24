// src/app/admin/marketplace/listings/page.tsx
// Admin view of all marketplace listings.
// Pending listings shown first — approve or reject with reason.
// Active listings can be deleted. Flagged listings can be approved or deleted.

import { db } from "@/lib/db";
import { marketplaceListing, user, marketplaceReport } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import AdminMarketListingsClient from "./listings-client";

export const dynamic = "force-dynamic";

export default async function AdminMarketListingsPage() {
  const rows = await db
    .select({
      id:          marketplaceListing.id,
      title:       marketplaceListing.title,
      category:    marketplaceListing.category,
      condition:   marketplaceListing.condition,
      price:       marketplaceListing.price,
      images:      marketplaceListing.images,
      status:      marketplaceListing.status,
      delivery:    marketplaceListing.delivery,
      listingType: marketplaceListing.listingType,
      createdAt:   marketplaceListing.createdAt,
      approvedAt:  marketplaceListing.approvedAt,
      lga:         marketplaceListing.lga,
      state:       marketplaceListing.state,
      sellerId:    marketplaceListing.sellerId,
            sellerName:     user.name,
      sellerPhone:    user.phoneNumber,
      sellerGovIdUrl: user.governmentIdUrl,
      sellerGovIdType: user.governmentIdType,
    })
    .from(marketplaceListing)
    .innerJoin(user, eq(marketplaceListing.sellerId, user.id))
    .orderBy(desc(marketplaceListing.createdAt))
    .catch(() => []);

  // Fetch open report counts per listing
  const listingIds = rows.map((r) => r.id);
  const reportRows = listingIds.length > 0
    ? await db
        .select({ listingId: marketplaceReport.listingId, id: marketplaceReport.id, reason: marketplaceReport.reason })
        .from(marketplaceReport)
        .where(and(
          inArray(marketplaceReport.listingId, listingIds),
          eq(marketplaceReport.status, "open"),
        ))
        .catch(() => [])
    : [];

  // Group reports by listing
  const reportMap: Record<string, { count: number; reasons: string[] }> = {};
  for (const r of reportRows) {
    if (!reportMap[r.listingId]) reportMap[r.listingId] = { count: 0, reasons: [] };
    reportMap[r.listingId].count++;
    reportMap[r.listingId].reasons.push(r.reason ?? "");
  }

    const listings = rows.map((r) => ({
    ...r,
    price:          r.price / 100,
    images:         r.images ?? [],
    reportCount:    reportMap[r.id]?.count ?? 0,
    reportReasons:  reportMap[r.id]?.reasons ?? [],
    sellerGovIdUrl:  r.sellerGovIdUrl  ?? null,
    sellerGovIdType: r.sellerGovIdType ?? null,
  }));

  const pending  = listings.filter((l) => l.status === "pending");
  const reported = listings.filter((l) => l.reportCount > 0);
  const active   = listings.filter((l) => l.status === "active"   && l.reportCount === 0);
  const flagged  = listings.filter((l) => l.status === "flagged"  && l.reportCount === 0);
  const others   = listings.filter((l) => !["pending", "active", "flagged"].includes(l.status) && l.reportCount === 0);

  return (
    <AdminMarketListingsClient
      pending={pending}
      active={active}
      flagged={flagged}
      others={others}
      reported={reported}
    />
  );
}