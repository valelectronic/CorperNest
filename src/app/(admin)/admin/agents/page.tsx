// src/app/admin/agents/page.tsx
import { db } from "@/lib/db";
import { user, listing, agentKycRequest } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getAgents() {
  // Get all verified agents with their listing count
  const agents = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      state: user.state,
      agentVerified: user.agentVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.role, "agent"))
    .orderBy(desc(user.createdAt));

  // Get listing counts per agent
  const listingCounts = await db
    .select({
      agentId: listing.agentId,
      total: count(),
      active: sql<number>`count(*) filter (where ${listing.status} = 'available')`,
    })
    .from(listing)
    .groupBy(listing.agentId);

  const countMap = Object.fromEntries(
    listingCounts.map((r) => [r.agentId, { total: Number(r.total), active: Number(r.active) }])
  );

  // Get KYC details
  const kycRows = await db
    .select({
      agentId: agentKycRequest.agentId,
      fullName: agentKycRequest.fullName,
      lga: agentKycRequest.lga,
      bankName: agentKycRequest.bankName,
      accountNumber: agentKycRequest.accountNumber,
      reviewedAt: agentKycRequest.reviewedAt,
    })
    .from(agentKycRequest)
    .where(eq(agentKycRequest.status, "approved"));

  const kycMap = Object.fromEntries(kycRows.map((k) => [k.agentId, k]));

  return agents.map((a) => ({
    ...a,
    listings: countMap[a.id] ?? { total: 0, active: 0 },
    kyc: kycMap[a.id] ?? null,
  }));
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminAgentsPage() {
  const agents = await getAgents();
  const verified = agents.filter((a) => a.agentVerified);
  const pending = agents.filter((a) => !a.agentVerified);

  return (
    <div style={{ padding: "32px 32px 48px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Agents
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {verified.length} verified · {pending.length} pending verification
        </p>
      </div>

      {/* Empty */}
      {agents.length === 0 && (
        <div style={{
          background: "var(--color-card)", border: "1px solid var(--color-border)",
          borderRadius: 16, padding: "48px 24px", textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>No agents yet</p>
        </div>
      )}

      {/* Verified agents */}
      {verified.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Verified Agents
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
            {verified.map((a) => (
              <div key={a.id} style={{
                background: "var(--color-card)", padding: "16px 20px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "center",
              }}>
                {/* Identity */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>
                      {a.name}
                    </p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: "#E8F5E9", color: "#2E7D32",
                      padding: "2px 8px", borderRadius: 20,
                    }}>
                      VERIFIED
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{a.email}</p>
                  {a.phone && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{a.phone}</p>}
                </div>

                {/* KYC info */}
                <div>
                  {a.kyc ? (
                    <>
                      <p style={{ fontSize: 13, color: "var(--color-text)", margin: "0 0 2px" }}>
                        {a.kyc.lga}, {a.state ?? "—"}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                        {a.kyc.bankName} · {a.kyc.accountNumber}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>No KYC data</p>
                  )}
                </div>

                {/* Listings */}
                <div>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 2px", fontFamily: "var(--font-heading)" }}>
                    {a.listings.total}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                    {a.listings.active} available
                  </p>
                </div>

                {/* Joined */}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                    Joined {formatDate(a.createdAt)}
                  </p>
                  {a.kyc?.reviewedAt && (
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                      Verified {formatDate(a.kyc.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending agents */}
      {pending.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Awaiting Verification
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
            {pending.map((a) => (
              <div key={a.id} style={{
                background: "var(--color-card)", padding: "16px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}>
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 3px" }}>
                    {a.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{a.email}</p>
                </div>
                <a
                  href="/admin/kyc?status=pending"
                  style={{
                    fontSize: 12, fontWeight: 600, color: "var(--color-primary)",
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  Review KYC →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}