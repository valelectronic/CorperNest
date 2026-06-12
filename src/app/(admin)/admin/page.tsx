// src/app/admin/page.tsx
import { db } from "@/lib/db";
import { user, listing, booking, inspectionPayment, agentKycRequest } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    totalUsers,
    totalAgents,
    pendingKyc,
    totalListings,
    activeListings,
    pendingListings,
    totalBookings,
    pendingBookings,
    scheduledBookings,
    verifiedBookings,
    totalPayments,
    revenueResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.agentVerified, true)),
    db.select({ count: count() }).from(agentKycRequest).where(eq(agentKycRequest.status, "pending")),
    db.select({ count: count() }).from(listing),
    db.select({ count: count() }).from(listing).where(eq(listing.status, "available")),
    db.select({ count: count() }).from(listing).where(eq(listing.status, "under-review")),
    db.select({ count: count() }).from(booking),
    db.select({ count: count() }).from(booking).where(eq(booking.status, "pending")),
    db.select({ count: count() }).from(booking).where(eq(booking.status, "scheduled")),
    db.select({ count: count() }).from(booking).where(eq(booking.status, "verified")),
    db.select({ count: count() }).from(inspectionPayment).where(eq(inspectionPayment.status, "paid")),
    db.select({ total: sql<number>`coalesce(sum(amount),0)` })
      .from(inspectionPayment)
      .where(eq(inspectionPayment.status, "paid")),
  ]);

  return {
    totalUsers:       totalUsers[0]?.count       ?? 0,
    totalAgents:      totalAgents[0]?.count       ?? 0,
    pendingKyc:       pendingKyc[0]?.count        ?? 0,
    totalListings:    totalListings[0]?.count     ?? 0,
    activeListings:   activeListings[0]?.count    ?? 0,
    pendingListings:  pendingListings[0]?.count   ?? 0,
    totalBookings:    totalBookings[0]?.count     ?? 0,
    pendingBookings:  pendingBookings[0]?.count   ?? 0,
    scheduledBookings: scheduledBookings[0]?.count ?? 0,
    verifiedBookings: verifiedBookings[0]?.count  ?? 0,
    totalPayments:    totalPayments[0]?.count     ?? 0,
    totalRevenue:     Number(revenueResult[0]?.total ?? 0),
  };
}

async function getRecentKyc() {
  const rows = await db
    .select({
      id:         agentKycRequest.id,
      fullName:   agentKycRequest.fullName,
      phone:      agentKycRequest.phone,
      state:      agentKycRequest.state,
      lga:        agentKycRequest.lga,
      status:     agentKycRequest.status,
      createdAt:  agentKycRequest.createdAt,
      agentEmail: user.email,
    })
    .from(agentKycRequest)
    .innerJoin(user, eq(agentKycRequest.agentId, user.id))
    .where(eq(agentKycRequest.status, "pending"))
    .limit(5);
  return rows;
}

async function getRecentBookings() {
  const rows = await db
    .select({
      id:          booking.id,
      bookingCode: booking.bookingCode,
      status:      booking.status,
      createdAt:   booking.createdAt,
      renterName:  user.name,
    })
    .from(booking)
    .innerJoin(user, eq(booking.renterId, user.id))
    .orderBy(sql`${booking.createdAt} desc`)
    .limit(5);
  return rows;
}

async function getPendingListings() {
  const rows = await db
    .select({
      id:        listing.id,
      title:     listing.title,
      lga:       listing.lga,
      createdAt: listing.createdAt,
      agentName: user.name,
    })
    .from(listing)
    .innerJoin(user, eq(listing.agentId, user.id))
    .where(eq(listing.status, "under-review"))
    .orderBy(sql`${listing.createdAt} desc`)
    .limit(5);
  return rows;
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: 16, padding: 20,
      borderLeft: accent ? "3px solid var(--color-primary)" : undefined,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px", fontFamily: "var(--font-heading)" }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: "var(--color-header)", margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "6px 0 0" }}>{sub}</p>
      )}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:        { bg: "#FFF8E1", color: "#B45309" },
    scheduled:      { bg: "#E8F5E9", color: "#2E7D32" },
    verified:       { bg: "#E3F2FD", color: "#1565C0" },
    completed:      { bg: "#F3E5F5", color: "#7B1FA2" },
    cancelled:      { bg: "#FAFAFA", color: "#757575" },
    approved:       { bg: "#E8F5E9", color: "#2E7D32" },
    declined:       { bg: "#FFEBEE", color: "#C62828" },
    "under-review": { bg: "#FFF8E1", color: "#92400E" },
  };
  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      textTransform: "capitalize",
    }}>
      {status.replace(/-/g, " ")}
    </span>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  const [stats, recentKyc, recentBookings, pendingListings] = await Promise.all([
    getStats(),
    getRecentKyc(),
    getRecentBookings(),
    getPendingListings(),
  ]);

  const revenueNaira      = (stats.totalRevenue / 100).toLocaleString("en-NG");
  const platformRevenue   = Math.round(stats.totalRevenue * 0.2 / 100).toLocaleString("en-NG");
  const totalAlerts       = stats.pendingKyc + stats.pendingListings;

  return (
    <div style={{ padding: "32px 24px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Overview
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          CorperNest platform snapshot
        </p>
      </div>

      {/* Alert banner */}
      {totalAlerts > 0 && (
        <div style={{
          background: "#FFF8E1", border: "1px solid #FAC775",
          borderRadius: 12, padding: "12px 16px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#B45309" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400E" }}>
            {[
              stats.pendingListings > 0 && `${stats.pendingListings} listing${stats.pendingListings !== 1 ? "s" : ""} awaiting review`,
              stats.pendingKyc > 0 && `${stats.pendingKyc} KYC request${stats.pendingKyc !== 1 ? "s" : ""} pending`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Users" value={stats.totalUsers} sub={`${stats.totalAgents} verified agents`} />
        <StatCard label="Pending KYC" value={stats.pendingKyc} accent={stats.pendingKyc > 0} sub="Awaiting review" />
        <StatCard label="Listings" value={stats.totalListings} sub={`${stats.activeListings} live · ${stats.pendingListings} pending`} />
        <StatCard label="Pending Review" value={stats.pendingListings} accent={stats.pendingListings > 0} sub="Not yet public" />
        <StatCard label="Bookings" value={stats.totalBookings} sub={`${stats.pendingBookings} pending · ${stats.scheduledBookings} scheduled`} />
        <StatCard label="Paid Inspections" value={stats.totalPayments} sub={`₦${revenueNaira} total`} />
        <StatCard label="Platform Revenue" value={`₦${platformRevenue}`} accent sub="20% of inspection fees" />
      </div>

      {/* Three columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>

        {/* Pending Listings */}
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>
              Listings for Review
            </p>
            <a href="/admin/listings" style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Review all →
            </a>
          </div>
          {pendingListings.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No listings pending</p>
            </div>
          ) : (
            pendingListings.map((l, i) => (
              <div key={l.id} style={{
                padding: "12px 20px",
                borderBottom: i < pendingListings.length - 1 ? "1px solid var(--color-border)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px", fontFamily: "var(--font-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.title}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                    {l.agentName} · {formatDate(l.createdAt)}
                  </p>
                </div>
                {statusBadge("under-review")}
              </div>
            ))
          )}
        </div>

        {/* Recent KYC */}
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>
              Pending KYC
            </p>
            <a href="/admin/kyc" style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </a>
          </div>
          {recentKyc.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No pending requests</p>
            </div>
          ) : (
            recentKyc.map((k, i) => (
              <div key={k.id} style={{
                padding: "12px 20px",
                borderBottom: i < recentKyc.length - 1 ? "1px solid var(--color-border)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                    {k.fullName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                    {k.agentEmail} · {k.lga}, {k.state}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, flexShrink: 0 }}>
                  {formatDate(k.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Recent Bookings */}
        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>
              Recent Bookings
            </p>
            <a href="/admin/bookings" style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </a>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No bookings yet</p>
            </div>
          ) : (
            recentBookings.map((b, i) => (
              <div key={b.id} style={{
                padding: "12px 20px",
                borderBottom: i < recentBookings.length - 1 ? "1px solid var(--color-border)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                    {b.renterName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{b.bookingCode}</p>
                </div>
                {statusBadge(b.status)}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}