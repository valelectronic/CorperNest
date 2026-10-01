// src/app/admin/parkout/applications/page.tsx
// Ambassador applications list with status filter tabs.

import { db } from "@/lib/db";
import { parkoutAmbassadorApplication } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic"

const STATUS_TABS = [
  { value: "pending_review",   label: "Pending review", color: "#F59E0B", bg: "#FFF8E1" },
  { value: "fee_paid",         label: "Fee paid",        color: "#3949AB", bg: "#E8EAF6" },
  { value: "pending_payment",  label: "Awaiting fee",    color: "#78909C", bg: "var(--color-light)" },
  { value: "approved",         label: "Approved",        color: "#15803D", bg: "#E8F5E9" },
  { value: "rejected",         label: "Rejected",        color: "#C62828", bg: "#FFEBEE" },
];

function timeAgo(date: Date | string | null) {
  if (!date) return "—";
  const diff  = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default async function AdminParkOutApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "pending_review";

  const applications = await db
    .select({
      id:           parkoutAmbassadorApplication.id,
      fullName:     parkoutAmbassadorApplication.fullName,
      phone:        parkoutAmbassadorApplication.phone,
      territoryLga: parkoutAmbassadorApplication.territoryLga,
      idType:       parkoutAmbassadorApplication.idType,
      status:       parkoutAmbassadorApplication.status,
      vetFeePaidAt: parkoutAmbassadorApplication.vetFeePaidAt,
      createdAt:    parkoutAmbassadorApplication.createdAt,
    })
    .from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.status, status))
    .orderBy(desc(parkoutAmbassadorApplication.createdAt));

  const statusConfig = STATUS_TABS.find((t) => t.value === status) ?? STATUS_TABS[0];

  return (
    <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 4px" }}>
          Ambassador Applications
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {applications.length} application{applications.length !== 1 ? "s" : ""} · {statusConfig.label.toLowerCase()}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
          <Link key={tab.value} href={`/admin/parkout/applications?status=${tab.value}`}
            style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: "none", backgroundColor: status === tab.value ? tab.bg : "var(--color-card)", color: status === tab.value ? tab.color : "var(--color-text-muted)", border: `1px solid ${status === tab.value ? tab.color + "40" : "var(--color-border)"}` }}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div style={{ borderRadius: 14, padding: "40px 20px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>No {statusConfig.label.toLowerCase()} applications</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {applications.map((app) => (
            <Link key={app.id} href={`/admin/parkout/applications/${app.id}`}
              style={{ display: "block", textDecoration: "none" }}>
              <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 3px" }}>{app.fullName ?? "Unknown"}</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 6px" }}>
                      {app.territoryLga ?? "—"} · {app.phone ?? "—"}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>ID: {app.idType ?? "—"}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Applied {timeAgo(app.createdAt)}</span>
                      {app.vetFeePaidAt && (
                        <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600 }}>✓ Fee paid</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: statusConfig.bg, color: statusConfig.color, whiteSpace: "nowrap" }}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}