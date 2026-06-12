// src/app/admin/bookings/page.tsx
import { db } from "@/lib/db";
import { booking, user, listing } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getBookings(status: string) {
  const where =
    status === "all"
      ? undefined
      : eq(booking.status, status as "pending" | "scheduled" | "verified" | "completed" | "cancelled");

  const rows = await db
    .select({
      id: booking.id,
      bookingCode: booking.bookingCode,
      status: booking.status,
      agreedDate: booking.agreedDate,
      agreedTime: booking.agreedTime,
      renterContact: booking.renterContact,
      renterContactType: booking.renterContactType,
      visitNote: booking.visitNote,
      createdAt: booking.createdAt,
      renterName: user.name,
      renterEmail: user.email,
      listingTitle: listing.title,
      listingAddress: listing.address,
      listingLga: listing.lga,
    })
    .from(booking)
    .innerJoin(user, eq(booking.renterId, user.id))
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .where(where)
    .orderBy(desc(booking.createdAt));

  return rows;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#FFF8E1", color: "#B45309" },
    scheduled: { bg: "#E8F5E9", color: "#2E7D32" },
    verified:  { bg: "#E3F2FD", color: "#1565C0" },
    completed: { bg: "#F3E5F5", color: "#7B1FA2" },
    cancelled: { bg: "#FAFAFA", color: "#757575" },
  };
  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      textTransform: "capitalize", flexShrink: 0,
    }}>
      {status}
    </span>
  );
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const rows = await getBookings(status);

  const tabs = [
    { label: "All",       value: "all" },
    { label: "Pending",   value: "pending" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Verified",  value: "verified" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div style={{ padding: "24px 16px 48px", maxWidth: 900, margin: "0 auto" }}>

      <style>{`
        @media (min-width: 640px) {
          .bookings-row { display: grid !important; grid-template-columns: 1fr 1.4fr 1fr auto !important; }
          .bookings-row-mobile-meta { display: none !important; }
          .bookings-row-top { margin-bottom: 0 !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Bookings
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {rows.length} booking{rows.length !== 1 ? "s" : ""}{status !== "all" ? ` · ${status}` : " total"}
        </p>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" as "touch" }}>
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/admin/bookings?status=${t.value}`}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              fontFamily: "var(--font-heading)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
              background: status === t.value ? "var(--color-primary)" : "var(--color-card)",
              color: status === t.value ? "#fff" : "var(--color-text-muted)",
              border: `1px solid ${status === t.value ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Empty */}
      {rows.length === 0 && (
        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, padding: "48px 24px", textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
            No {status === "all" ? "" : status} bookings
          </p>
        </div>
      )}

      {/* Cards — stack on mobile, grid on desktop */}
      {rows.length > 0 && (
        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {rows.map((b, i) => (
            <div
              key={b.id}
              className="bookings-row"
              style={{
                padding: "14px 16px",
                borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {/* Top row: name + badge on mobile */}
              <div className="bookings-row-top" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: "0 0 2px" }}>
                    {b.renterName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
                    {b.renterEmail}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, fontFamily: "var(--font-mono)" }}>
                    {b.bookingCode}
                  </p>
                </div>
                {/* Badge shown inline on mobile, hidden on desktop via grid reflow */}
                <div className="bookings-row-mobile-meta" style={{ display: "flex" }}>
                  {statusBadge(b.status)}
                </div>
              </div>

              {/* Listing */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px" }}>
                  {b.listingTitle}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                  {b.listingAddress}, {b.listingLga}
                </p>
              </div>

              {/* Date */}
              <div>
                <p style={{ fontSize: 12, color: "var(--color-text)", margin: "0 0 2px" }}>
                  {b.agreedDate ? `${formatDate(b.agreedDate)} · ${b.agreedTime ?? ""}` : "Date TBD"}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                  Booked {formatDate(b.createdAt)}
                </p>
              </div>

              {/* Badge — shown in grid column on desktop only */}
              <div style={{ display: "none" }} className="bookings-status-desktop">
                {statusBadge(b.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: show badge in 4th grid column */}
      <style>{`
        @media (min-width: 640px) {
          .bookings-row-mobile-meta { display: none !important; }
          .bookings-status-desktop  { display: flex !important; align-items: center; }
        }
      `}</style>
    </div>
  );
}