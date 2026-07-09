// src/app/admin/payments/page.tsx
import { db } from "@/lib/db";
import { inspectionPayment, user, payoutSplit, booking, listing } from "@/db/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";

export const revalidate = 30;

async function getInspectionPayments() {
  const rows = await db
    .select({
      id:          inspectionPayment.id,
      paystackRef: inspectionPayment.paystackRef,
      amount:      inspectionPayment.amount,
      status:      inspectionPayment.status,
      createdAt:   inspectionPayment.createdAt,
      renterName:  user.name,
      renterEmail: user.email,
    })
    .from(inspectionPayment)
    .innerJoin(user, eq(inspectionPayment.renterId, user.id))
    .orderBy(desc(inspectionPayment.createdAt));

  return rows;
}

async function getCommissionPayments() {
  // Reads from booking table where agent has paid commission
  const rows = await db
    .select({
      id:               booking.id,
      bookingCode:      booking.bookingCode,
      commissionPaidAt: booking.commissionPaidAt,
      agentName:        user.name,
      agentEmail:       user.email,
      listingTitle:     listing.title,
      listingLga:       listing.lga,
    })
    .from(booking)
    .innerJoin(user, eq(booking.agentId, user.id))
    .innerJoin(listing, eq(booking.listingId, listing.id))
    .where(
      and(
        eq(booking.commissionStatus, "paid"),
        isNotNull(booking.commissionPaidAt)
      )
    )
    .orderBy(desc(booking.commissionPaidAt));

  return rows;
}

async function getPayoutSummary() {
  const result = await db
    .select({
      status: payoutSplit.status,
      total:  sql<number>`coalesce(sum(${payoutSplit.amount}), 0)`,
      count:  sql<number>`count(*)`,
    })
    .from(payoutSplit)
    .groupBy(payoutSplit.status);

  const pending = result.find((r) => r.status === "pending");
  const paid    = result.find((r) => r.status === "paid");

  return {
    pendingAmount: Number(pending?.total ?? 0),
    pendingCount:  Number(pending?.count ?? 0),
    paidAmount:    Number(paid?.total    ?? 0),
    paidCount:     Number(paid?.count    ?? 0),
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    paid:    { bg: "#E8F5E9", color: "#2E7D32" },
    pending: { bg: "#FFF8E1", color: "#B45309" },
    expired: { bg: "#FAFAFA", color: "#757575" },
  };
  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, textTransform: "capitalize", flexShrink: 0 }}>
      {status}
    </span>
  );
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default async function AdminPaymentsPage() {
  const [payments, commissions, payouts] = await Promise.all([
    getInspectionPayments(),
    getCommissionPayments(),
    getPayoutSummary(),
  ]);

  const paid           = payments.filter((p) => p.status === "paid");
  const totalCollected = paid.reduce((sum, p) => sum + p.amount, 0);
  const platformRevenue = Math.round(totalCollected * 0.2);

  // Commission: ₦1,000 = 100000 kobo per paid commission
  const totalCommission = commissions.length * 100000;

  const summaryCards = [
    { label: "Inspection Fees",    value: formatNaira(totalCollected),       sub: `${paid.length} paid inspections`,        accent: false },
    { label: "Commission Earned",  value: `₦${(totalCommission / 100).toLocaleString()}`, sub: `${commissions.length} agent commissions`, accent: true  },
    { label: "Pending Payouts",    value: formatNaira(payouts.pendingAmount), sub: `${payouts.pendingCount} splits pending`,  accent: false },
    { label: "Paid Out",           value: formatNaira(payouts.paidAmount),    sub: `${payouts.paidCount} splits paid`,        accent: false },
  ];

  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 720, margin: "0 auto" }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Payments
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Inspection fees and agent commissions
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {summaryCards.map((c) => (
          <div key={c.label} style={{ background: c.accent ? "var(--color-primary)" : "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "16px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: c.accent ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {c.label}
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: c.accent ? "#fff" : "var(--color-header)", margin: "0 0 4px", lineHeight: 1 }}>
              {c.value}
            </p>
            <p style={{ fontSize: 11, color: c.accent ? "rgba(255,255,255,0.6)" : "var(--color-text-muted)", margin: 0 }}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── COMMISSION PAYMENTS ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: "0 0 14px" }}>
          Agent Commissions · {commissions.length}
        </h2>

        {commissions.length === 0 ? (
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No commission payments yet</p>
          </div>
        ) : (
          <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
            {commissions.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < commissions.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.agentName}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.agentEmail}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
                    {c.listingTitle} · {c.listingLga} · {c.bookingCode}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {formatDate(c.commissionPaidAt)}
                  </p>
                  <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>
                    ₦1,000
                  </p>
                  <StatusBadge status="paid" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── INSPECTION PAYMENTS ── */}
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: "0 0 14px" }}>
          Inspection Fees · {payments.length}
        </h2>

        <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
          {payments.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, padding: 24, textAlign: "center" }}>No inspection payments yet</p>
          ) : payments.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < payments.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)" }}>
                  {p.renterName}
                </p>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.renterEmail}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {p.paystackRef}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)" }}>
                  {formatDate(p.createdAt)}
                </p>
                <p style={{ margin: "0 0 4px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>
                  {formatNaira(p.amount)}
                </p>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}