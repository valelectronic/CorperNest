// src/app/admin/payments/page.tsx
import { db } from "@/lib/db";
import { inspectionPayment, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const revalidate = 30;

// ── Inspection payments ─────────────────────────────────────────────────────

async function getInspectionPayments() {
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    paid: { bg: "#E8F5E9", color: "#2E7D32" },
    pending: { bg: "#FFF8E1", color: "#B45309" },
    expired: { bg: "#FAFAFA", color: "#757575" },
  };

  const s = map[status] ?? { bg: "#F5F5F5", color: "#666" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        textTransform: "capitalize",
        flexShrink: 0,
      }}
    >
      {status}
    </span>
  );
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPaymentsPage() {
  const payments = await getInspectionPayments();

  const paid = payments.filter((p) => p.status === "paid");
  const totalCollected = paid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 720, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--color-header)",
            margin: "0 0 4px",
          }}
        >
          Payments
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Park-Out inspection fees
        </p>
      </div>

      {/* ── Summary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Inspection Fees
          </p>

          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              fontWeight: 800,
              color: "var(--color-header)",
              margin: "0 0 4px",
              lineHeight: 1,
            }}
          >
            {formatNaira(totalCollected)}
          </p>

          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              margin: 0,
            }}
          >
            {paid.length} paid inspections
          </p>
        </div>

        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Transactions
          </p>

          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              fontWeight: 800,
              color: "var(--color-header)",
              margin: "0 0 4px",
              lineHeight: 1,
            }}
          >
            {payments.length}
          </p>

          <p
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              margin: 0,
            }}
          >
            inspection payments
          </p>
        </div>
      </div>

      {/* ── INSPECTION PAYMENTS ── */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-header)",
            margin: "0 0 14px",
          }}
        >
          Inspection Fees · {payments.length}
        </h2>

        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {payments.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                margin: 0,
                padding: 24,
                textAlign: "center",
              }}
            >
              No inspection payments yet
            </p>
          ) : (
            payments.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom:
                    i < payments.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--color-header)",
                    }}
                  >
                    {p.renterName}
                  </p>

                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.renterEmail}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {p.paystackRef}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {formatDate(p.createdAt)}
                  </p>

                  <p
                    style={{
                      margin: "0 0 4px",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--color-primary)",
                    }}
                  >
                    {formatNaira(p.amount)}
                  </p>

                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}