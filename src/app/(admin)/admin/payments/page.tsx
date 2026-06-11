// src/app/admin/payments/page.tsx
import { db } from "@/lib/db";
import { inspectionPayment, user, booking, payoutSplit } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getPayments() {
  const rows = await db
    .select({
      id: inspectionPayment.id,
      paystackRef: inspectionPayment.paystackRef,
      amount: inspectionPayment.amount,
      status: inspectionPayment.status,
      createdAt: inspectionPayment.createdAt,
      renterName: user.name,
      renterEmail: user.email,
    })
    .from(inspectionPayment)
    .innerJoin(user, eq(inspectionPayment.renterId, user.id))
    .orderBy(desc(inspectionPayment.createdAt));

  return rows;
}

async function getPayoutSummary() {
  const result = await db
    .select({
      status: payoutSplit.status,
      total: sql<number>`coalesce(sum(${payoutSplit.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(payoutSplit)
    .groupBy(payoutSplit.status);

  const pending = result.find((r) => r.status === "pending");
  const paid = result.find((r) => r.status === "paid");

  return {
    pendingAmount: Number(pending?.total ?? 0),
    pendingCount: Number(pending?.count ?? 0),
    paidAmount: Number(paid?.total ?? 0),
    paidCount: Number(paid?.count ?? 0),
  };
}

function paymentStatusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    paid:    { bg: "#E8F5E9", color: "#2E7D32" },
    pending: { bg: "#FFF8E1", color: "#B45309" },
    expired: { bg: "#FAFAFA", color: "#757575" },
  };
  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default async function AdminPaymentsPage() {
  const [payments, payouts] = await Promise.all([getPayments(), getPayoutSummary()]);

  const paid = payments.filter((p) => p.status === "paid");
  const totalCollected = paid.reduce((sum, p) => sum + p.amount, 0);
  const platformRevenue = Math.round(totalCollected * 0.2);

  return (
    <div style={{ padding: "32px 32px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Payments
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Inspection fees and payout status
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Collected", value: formatNaira(totalCollected), sub: `${paid.length} paid inspections` },
          { label: "Platform Revenue", value: formatNaira(platformRevenue), sub: "20% of total", accent: true },
          { label: "Pending Payouts", value: formatNaira(payouts.pendingAmount), sub: `${payouts.pendingCount} splits pending` },
          { label: "Paid Out", value: formatNaira(payouts.paidAmount), sub: `${payouts.paidCount} splits paid` },
        ].map((c) => (
          <div key={c.label} style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: 20,
            borderLeft: c.accent ? "3px solid var(--color-primary)" : undefined,
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px", fontFamily: "var(--font-heading)" }}>
              {c.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
              {c.value}
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Payout note */}
      {payouts.pendingAmount > 0 && (
        <div style={{
          background: "#FFF8E1", border: "1px solid #FDE68A",
          borderRadius: 12, padding: "12px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#B45309" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 13, color: "#B45309", margin: 0 }}>
            <strong>{formatNaira(payouts.pendingAmount)}</strong> in pending agent payouts — mark as paid after manual transfer in your bank app.
          </p>
        </div>
      )}

      {/* Empty */}
      {payments.length === 0 && (
        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, padding: "48px 24px", textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>No payments yet</p>
        </div>
      )}

      {/* Payments table */}
      {payments.length > 0 && (
        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px",
            gap: 16, padding: "12px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}>
            {["Renter", "Reference", "Amount", "Status"].map((h) => (
              <p key={h} style={{
                fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)",
                textTransform: "uppercase", letterSpacing: "0.05em", margin: 0,
                fontFamily: "var(--font-heading)",
              }}>
                {h}
              </p>
            ))}
          </div>

          {payments.map((p, i) => (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px",
              gap: 16, padding: "14px 20px", alignItems: "center",
              borderBottom: i < payments.length - 1 ? "1px solid var(--color-border)" : "none",
            }}>
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, color: "var(--color-header)", margin: "0 0 2px" }}>
                  {p.renterName}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{p.renterEmail}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text)", margin: "0 0 2px" }}>
                  {p.paystackRef}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{formatDate(p.createdAt)}</p>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-header)", margin: 0, fontFamily: "var(--font-heading)" }}>
                {formatNaira(p.amount)}
              </p>
              {paymentStatusBadge(p.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}