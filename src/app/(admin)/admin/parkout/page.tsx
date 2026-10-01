// src/app/admin/parkout/page.tsx
// Park-Out & Earn admin overview.
// Shows stats + quick action buttons + recent pending items.

import { db } from "@/lib/db";
import { parkoutListing, parkoutAmbassadorApplication, parkoutAmbassador } from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import Link from "next/link";


export const dynamic = "force-dynamic"

async function getStats() {
  const [
    pendingListings,
    activeListings,
    pendingApplications,
    activeAmbassadors,
    completedDeals,
  ] = await Promise.all([
    db.select({ count: count() }).from(parkoutListing).where(eq(parkoutListing.status, "pending_approval")),
    db.select({ count: count() }).from(parkoutListing).where(eq(parkoutListing.status, "active")),
    db.select({ count: count() }).from(parkoutAmbassadorApplication).where(eq(parkoutAmbassadorApplication.status, "pending_review")),
    db.select({ count: count() }).from(parkoutAmbassador).where(eq(parkoutAmbassador.status, "active")),
    db.select({ count: count() }).from(parkoutListing).where(eq(parkoutListing.status, "completed")),
  ]);

  return {
    pendingListings:     pendingListings[0]?.count    ?? 0,
    activeListings:      activeListings[0]?.count     ?? 0,
    pendingApplications: pendingApplications[0]?.count ?? 0,
    activeAmbassadors:   activeAmbassadors[0]?.count  ?? 0,
    completedDeals:      completedDeals[0]?.count     ?? 0,
  };
}

async function getRecentPending() {
  const listings = await db
    .select({
      id:            parkoutListing.id,
      title:         parkoutListing.title,
      lga:           parkoutListing.lga,
      annualRent:    parkoutListing.annualRent,
      createdAt:     parkoutListing.createdAt,
    })
    .from(parkoutListing)
    .where(eq(parkoutListing.status, "pending_approval"))
    .orderBy(parkoutListing.createdAt)
    .limit(5);

  const applications = await db
    .select({
      id:           parkoutAmbassadorApplication.id,
      fullName:     parkoutAmbassadorApplication.fullName,
      territoryLga: parkoutAmbassadorApplication.territoryLga,
      createdAt:    parkoutAmbassadorApplication.createdAt,
    })
    .from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.status, "pending_review"))
    .orderBy(parkoutAmbassadorApplication.createdAt)
    .limit(5);

  return { listings, applications };
}

function StatCard({ label, value, href, urgent }: { label: string; value: number; href: string; urgent?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        borderRadius: 14, padding: "16px",
        backgroundColor: urgent && value > 0 ? "#FFF8E1" : "var(--color-card)",
        border: `1px solid ${urgent && value > 0 ? "#FAC775" : "var(--color-border)"}`,
        cursor: "pointer",
      }}>
        <p style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-heading)", color: urgent && value > 0 ? "#F59E0B" : "var(--color-primary)", margin: "0 0 4px" }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{label}</p>
        {urgent && value > 0 && (
          <p style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", margin: "4px 0 0" }}>Needs attention →</p>
        )}
      </div>
    </Link>
  );
}

export default async function AdminParkOutPage() {
  const [stats, recent] = await Promise.all([getStats(), getRecentPending()]);

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
          Park-Out & Earn
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Manage listings, ambassadors and deal completions
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <StatCard label="Pending listings"      value={stats.pendingListings}     href="/admin/parkout/listings?status=pending_approval" urgent />
        <StatCard label="Active listings"       value={stats.activeListings}      href="/admin/parkout/listings?status=active" />
        <StatCard label="Pending applications"  value={stats.pendingApplications} href="/admin/parkout/applications?status=pending_review" urgent />
        <StatCard label="Active ambassadors"    value={stats.activeAmbassadors}   href="/admin/parkout/ambassadors" />
      </div>

      {/* Completed deals */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total completed deals</p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 900, color: "#15803D", margin: 0 }}>{stats.completedDeals}</p>
        </div>
        <span style={{ fontSize: 40 }}>🤝</span>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
          Quick actions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Review pending listings",      href: "/admin/parkout/listings?status=pending_approval",   icon: "🏠" },
            { label: "Review ambassador applications", href: "/admin/parkout/applications?status=pending_review", icon: "📋" },
            { label: "Add ambassador manually",       href: "/admin/parkout/ambassadors/new",                    icon: "➕" },
            { label: "View all ambassadors",          href: "/admin/parkout/ambassadors",                        icon: "👤" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textDecoration: "none" }}>
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{action.label}</span>
              <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent pending listings */}
      {recent.listings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Pending listings
            </p>
            <Link href="/admin/parkout/listings?status=pending_approval" style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              View all
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.listings.map((l) => (
              <Link key={l.id} href={`/admin/parkout/listings/${l.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textDecoration: "none" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px" }}>{l.title}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                    {l.lga} · ₦{((l.annualRent ?? 0) / 100).toLocaleString("en-NG")}/yr
                  </p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: "#FFF8E1", color: "#F59E0B" }}>
                  Pending
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent pending applications */}
      {recent.applications.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Pending applications
            </p>
            <Link href="/admin/parkout/applications?status=pending_review" style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              View all
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.applications.map((a) => (
              <Link key={a.id} href={`/admin/parkout/applications/${a.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textDecoration: "none" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px" }}>{a.fullName ?? "Unknown"}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{a.territoryLga} territory</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: "#E8EAF6", color: "#3949AB" }}>
                  Review
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.pendingListings === 0 && stats.pendingApplications === 0 && (
        <div style={{ borderRadius: 14, padding: "32px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>✅</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>All caught up</p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>No pending listings or applications right now</p>
        </div>
      )}
    </div>
  );
}