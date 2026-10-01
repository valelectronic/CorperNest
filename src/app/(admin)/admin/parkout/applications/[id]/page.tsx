// src/app/admin/parkout/applications/[id]/page.tsx
// Single ambassador application detail — full info + approve/reject actions.

import { db } from "@/lib/db";
import { parkoutAmbassadorApplication, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import ApplicationActions from "./application-actions";

type Props = { params: Promise<{ id: string }> };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)", width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", flex: 1 }}>{value}</span>
    </div>
  );
}

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  pending_payment:  { color: "#78909C", bg: "var(--color-light)" },
  fee_paid:         { color: "#3949AB", bg: "#E8EAF6" },
  pending_review:   { color: "#F59E0B", bg: "#FFF8E1" },
  approved:         { color: "#15803D", bg: "#E8F5E9" },
  rejected:         { color: "#C62828", bg: "#FFEBEE" },
};

export default async function AdminApplicationDetailPage({ params }: Props) {
  const { id } = await params;

  const [application] = await db
    .select().from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.id, id)).limit(1);

  if (!application) notFound();

  const [applicant] = await db
    .select({ name: user.name, email: user.email })
    .from(user).where(eq(user.id, application.userId)).limit(1);

  const sc = STATUS_COLOR[application.status] ?? { color: "var(--color-text-muted)", bg: "var(--color-light)" };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <Link href="/admin/parkout/applications" style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
        ← Back to applications
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
          {application.fullName ?? "Ambassador Application"}
        </h1>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backgroundColor: sc.bg, color: sc.color }}>
          {application.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Actions */}
      {(application.status === "pending_review" || application.status === "fee_paid") && (
        <ApplicationActions applicationId={application.id} userId={application.userId} />
      )}

      {/* Account details */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Account</p>
        <Row label="Name"  value={applicant?.name ?? "—"} />
        <Row label="Email" value={applicant?.email ?? "—"} />
      </div>

      {/* Personal details */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Personal details</p>
        <Row label="Full name"    value={application.fullName ?? "—"} />
        <Row label="Phone"        value={application.phone ?? "—"} />
        <Row label="WhatsApp"     value={application.whatsappNumber ?? "—"} />
        <Row label="Territory"    value={`${application.territoryLga ?? "—"}, ${application.territoryState ?? "—"}`} />
        <Row label="ID type"      value={application.idType ?? "—"} />
        <Row label="ID number"    value={application.idNumber ?? "—"} />
        <Row label="ID document"  value={application.idDocumentUrl
          ? <a href={application.idDocumentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>View ID →</a>
          : "—"} />
      </div>

      {/* Bank details */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Bank details</p>
        <Row label="Bank code"      value={application.bankCode ?? "—"} />
        <Row label="Account number" value={application.accountNumber ?? "—"} />
        <Row label="Account name"   value={application.accountName ?? "—"} />
      </div>

      {/* Payment */}
      <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Vetting fee</p>
        <Row label="Fee paid"   value={application.vetFeePaidAt ? `✓ ${new Date(application.vetFeePaidAt).toLocaleDateString("en-NG")}` : "Not paid"} />
        <Row label="Reference"  value={application.vetFeeRef ?? "—"} />
      </div>
    </div>
  );
}