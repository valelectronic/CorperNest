// src/app/admin/agents/page.tsx
import { db } from "@/lib/db";
import { user, listing, agentKycRequest } from "@/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getAgents() {
  const agents = await db
    .select({
      id:            user.id,
      name:          user.name,
      email:         user.email,
      phone:         user.phone,
      state:         user.state,
      agentVerified: user.agentVerified,
      createdAt:     user.createdAt,
    })
    .from(user)
    .where(eq(user.role, "agent"))
    .orderBy(desc(user.createdAt));

  const listingCounts = await db
    .select({
      agentId: listing.agentId,
      total:   count(),
      active:  sql<number>`count(*) filter (where ${listing.status} = 'available')`,
    })
    .from(listing)
    .groupBy(listing.agentId);

  const countMap = Object.fromEntries(
    listingCounts.map((r) => [r.agentId, { total: Number(r.total), active: Number(r.active) }])
  );

  const kycRows = await db
    .select({
      agentId:       agentKycRequest.agentId,
      fullName:      agentKycRequest.fullName,
      lga:           agentKycRequest.lga,
      bankName:      agentKycRequest.bankName,
      accountNumber: agentKycRequest.accountNumber,
      reviewedAt:    agentKycRequest.reviewedAt,
    })
    .from(agentKycRequest)
    .where(eq(agentKycRequest.status, "approved"));

  const kycMap = Object.fromEntries(kycRows.map((k) => [k.agentId, k]));

  return agents.map((a) => ({
    ...a,
    listings: countMap[a.id] ?? { total: 0, active: 0 },
    kyc:      kycMap[a.id]   ?? null,
  }));
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function AgentCard({ agent, verified }: {
  agent: Awaited<ReturnType<typeof getAgents>>[number];
  verified: boolean;
}) {
  return (
    <div style={{
      background: "var(--color-card)", padding: "16px",
      borderBottom: "1px solid var(--color-border)",
    }}>
      {/* Top row: name + badge + listing count */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>
              {agent.name}
            </p>
            {verified && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: "#E8F5E9", color: "#2E7D32",
                padding: "2px 8px", borderRadius: 20, flexShrink: 0,
              }}>
                VERIFIED
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 2px" }}>{agent.email}</p>
          {agent.phone && (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>{agent.phone}</p>
          )}
        </div>

        {/* Listing count */}
        {verified && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: 0, fontFamily: "var(--font-heading)", lineHeight: 1 }}>
              {agent.listings.total}
            </p>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
              {agent.listings.active} live
            </p>
          </div>
        )}
      </div>

      {/* KYC details row */}
      {verified && agent.kyc && (
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          background: "var(--color-bg)", borderRadius: 10,
          padding: "10px 12px", border: "1px solid var(--color-border)",
          marginBottom: 8,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Location</p>
            <p style={{ fontSize: 12, color: "var(--color-text)", margin: 0 }}>{agent.kyc.lga}, {agent.state ?? "—"}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>Bank</p>
            <p style={{ fontSize: 12, color: "var(--color-text)", margin: 0 }}>{agent.kyc.bankName} · {agent.kyc.accountNumber}</p>
          </div>
        </div>
      )}

      {/* Footer: dates */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
          Joined {formatDate(agent.createdAt)}
        </p>
        {agent.kyc?.reviewedAt && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
            Verified {formatDate(agent.kyc.reviewedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function AdminAgentsPage() {
  const agents   = await getAgents();
  const verified = agents.filter((a) => a.agentVerified);
  const pending  = agents.filter((a) => !a.agentVerified);

  return (
    <div style={{ padding: "24px 16px 48px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
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
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Verified Agents · {verified.length}
          </p>
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
            {verified.map((a) => (
              <AgentCard key={a.id} agent={a} verified={true} />
            ))}
          </div>
        </div>
      )}

      {/* Pending agents */}
      {pending.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Awaiting Verification · {pending.length}
          </p>
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
            {pending.map((a) => (
              <div key={a.id} style={{
                background: "var(--color-card)", padding: "14px 16px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.email}
                  </p>
                </div>
                <a
                  href="/admin/kyc?status=pending"
                  style={{
                    fontSize: 12, fontWeight: 600, color: "var(--color-primary)",
                    textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  Review →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}