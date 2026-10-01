// src/app/admin/parkout/listings/page.tsx
// All Park-Out listings with filter tabs.
// Admin can filter by status and click into each for full details + actions.

import { db } from "@/lib/db";
import { parkoutListing, parkoutAmbassador, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic"

const STATUS_TABS = [
  { value: "pending_approval", label: "Pending",   color: "#F59E0B", bg: "#FFF8E1" },
  { value: "active",           label: "Active",    color: "#15803D", bg: "#E8F5E9" },
  { value: "completed",        label: "Completed", color: "#3949AB", bg: "#E8EAF6" },
  { value: "rejected",         label: "Rejected",  color: "#C62828", bg: "#FFEBEE" },
];

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function timeAgo(date: Date | string | null) {
  if (!date) return "—";
  const diff  = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default async function AdminParkOutListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "pending_approval";

  const listings = await db
    .select({
      id:             parkoutListing.id,
      title:          parkoutListing.title,
      roomType:       parkoutListing.roomType,
      lga:            parkoutListing.lga,
      state:          parkoutListing.state,
      annualRent:     parkoutListing.annualRent,
      moveOutDate:    parkoutListing.moveOutDate,
      status:         parkoutListing.status,
      createdAt:      parkoutListing.createdAt,
      ambassadorId:   parkoutListing.ambassadorId,
      outgoingUserId: parkoutListing.outgoingUserId,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.status, status))
    .orderBy(desc(parkoutListing.createdAt));

  const statusConfig = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
          Park-Out Listings
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {listings.length} listing{listings.length !== 1 ? "s" : ""} · {statusConfig.label.toLowerCase()}
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <Link key={tab.value} href={`/admin/parkout/listings?status=${tab.value}`}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              textDecoration: "none",
              backgroundColor: status === tab.value ? tab.bg : "var(--color-card)",
              color: status === tab.value ? tab.color : "var(--color-text-muted)",
              border: `1px solid ${status === tab.value ? tab.color + "40" : "var(--color-border)"}`,
            }}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div style={{ borderRadius: 14, padding: "40px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>🏠</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>No {statusConfig.label.toLowerCase()} listings</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Nothing here right now</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listings.map((listing) => (
            <Link key={listing.id} href={`/admin/parkout/listings/${listing.id}`}
              style={{ display: "block", textDecoration: "none" }}>
              <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {listing.title}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 8px" }}>
                      {listing.lga}, {listing.state}
                    </p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>
                        {formatNaira(listing.annualRent ?? 0)}/yr
                      </span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        Move-out: {listing.moveOutDate ? new Date(listing.moveOutDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                        Listed {timeAgo(listing.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                      backgroundColor: statusConfig.bg, color: statusConfig.color, whiteSpace: "nowrap",
                    }}>
                      {statusConfig.label}
                    </span>
                    {!listing.ambassadorId && listing.status === "active" && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20, backgroundColor: "#FFEBEE", color: "#C62828" }}>
                        No ambassador
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}