// src/app/admin/kyc/page.tsx
import { db } from "@/lib/db";
import { agentKycRequest, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import KycActions from "@/app/(admin)/kyc-actions";

export const revalidate = 30;

async function getKycRequests(status: string) {
  const where =
    status === "all"
      ? undefined
      : eq(agentKycRequest.status, status as "pending" | "approved" | "declined");

  const rows = await db
    .select({
      id: agentKycRequest.id,
      agentId: agentKycRequest.agentId,
      fullName: agentKycRequest.fullName,
      phone: agentKycRequest.phone,
      whatsapp: agentKycRequest.whatsapp,
      state: agentKycRequest.state,
      lga: agentKycRequest.lga,
      bankName: agentKycRequest.bankName,
      accountNumber: agentKycRequest.accountNumber,
      accountName: agentKycRequest.accountName,
      status: agentKycRequest.status,
      adminNote: agentKycRequest.adminNote,
      reviewedAt: agentKycRequest.reviewedAt,
      createdAt: agentKycRequest.createdAt,
      agentEmail: user.email,
      agentName: user.name,
    })
    .from(agentKycRequest)
    .innerJoin(user, eq(agentKycRequest.agentId, user.id))
    .where(where)
    .orderBy(desc(agentKycRequest.createdAt));

  return rows;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#FFF8E1", color: "#B45309" },
    approved: { bg: "#E8F5E9", color: "#2E7D32" },
    declined: { bg: "#FFEBEE", color: "#C62828" },
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
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "pending" } = await searchParams;
  const rows = await getKycRequests(status);

  const tabs = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Declined", value: "declined" },
    { label: "All", value: "all" },
  ];

  return (
    <div style={{ padding: "32px 32px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          KYC Requests
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Review and verify agent identity submissions
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/admin/kyc?status=${t.value}`}
            style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-heading)", textDecoration: "none",
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
            No {status === "all" ? "" : status} KYC requests
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((k) => (
          <div key={k.id} style={{
            background: "var(--color-card)", border: "1px solid var(--color-border)",
            borderRadius: 16, padding: 20,
          }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: 0 }}>
                    {k.fullName}
                  </p>
                  {statusBadge(k.status)}
                </div>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                  {k.agentEmail} · Submitted {formatDate(k.createdAt)}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Phone", value: k.phone },
                { label: "WhatsApp", value: k.whatsapp },
                { label: "Location", value: `${k.lga}, ${k.state}` },
                { label: "Bank", value: k.bankName },
                { label: "Account No.", value: k.accountNumber },
                { label: "Account Name", value: k.accountName },
              ].map((f) => (
                <div key={f.label} style={{
                  background: "var(--color-bg)", borderRadius: 10,
                  padding: "10px 12px",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>
                    {f.label}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-heading)" }}>
                    {f.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Admin note (declined) */}
            {k.adminNote && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              }}>
                <p style={{ fontSize: 12, color: "#C62828", margin: 0 }}>
                  <strong>Decline reason:</strong> {k.adminNote}
                </p>
              </div>
            )}

            {/* Actions — only for pending */}
            {k.status === "pending" && (
              <KycActions agentId={k.agentId} requestId={k.id} />
            )}

            {/* Reviewed note */}
            {k.reviewedAt && k.status !== "pending" && (
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                Reviewed {formatDate(k.reviewedAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}