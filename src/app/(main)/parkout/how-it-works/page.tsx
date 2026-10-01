// src/app/(main)/parkout/how-it-works/page.tsx
// Explains the Park-Out & Earn feature in full detail.
// Steps, payment information, ambassador info and protection.

"use client";

import { useRouter } from "next/navigation";

function Step({ icon, step, title, body }: { icon: string; step: number; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: "var(--color-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          {icon}
        </div>
        <span style={{
          position: "absolute", top: -6, right: -6,
          width: 16, height: 16, borderRadius: "50%",
          backgroundColor: "var(--color-card)",
          border: "2px solid var(--color-primary)",
          fontSize: 9, fontWeight: 800, color: "var(--color-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {step}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.65 }}>{body}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)",
      textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px",
    }}>
      {children}
    </p>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 48 }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
        padding: "24px 20px 20px",
      }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Back</span>
        </button>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
          How Park-Out & Earn works
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6 }}>
          Everything you need to know about listing your room, inspections and the Park-Out process.
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── STATS ── */}
        <div style={{
          borderRadius: 14, padding: "16px",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
          textAlign: "center",
        }}>
          {[
            { value: "10%",   label: "Facilitation fee" },
            { value: "₦3k",  label: "Inspection fee" },
            { value: "48hrs", label: "Inspection lock" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── FOR OUTGOING TENANTS ── */}
        <div>
          <SectionTitle>For outgoing tenants — earn from your move-out</SectionTitle>
          <div style={{
            borderRadius: 16, padding: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <Step step={1} icon="📸" title="List your room — free"
              body="Post 3-5 interior photos, your annual rent, move-out date and landlord rules. Takes under 3 minutes." />
            <Step step={2} icon="✅" title="Ambassador verifies"
              body="A CorperNest Location Ambassador calls you to verify the listing. Once confirmed, your room goes live." />
            <Step step={3} icon="🔒" title="Incoming tenant books inspection"
              body="Serious tenants pay ₦3,000 to lock an inspection slot. Our Ambassador escorts them to the property." />
            <Step step={4} icon="🤝" title="Keys change hands"
              body="Incoming tenant moves in. Ambassador confirms the handover. The agreed payment arrangements are then completed outside CorperNest." />
            <Step step={5} icon="💰" title="Complete the agreed payment arrangements"
              body="Once the handover is confirmed, the agreed payment arrangements are completed outside CorperNest." />
          </div>
        </div>

        {/* ── FOR INCOMING TENANTS ── */}
        <div>
          <SectionTitle>For incoming tenants — find a room faster</SectionTitle>
          <div style={{
            borderRadius: 16, padding: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <Step step={1} icon="🔍" title="Browse verified listings"
              body="See real rooms from outgoing tenants. Photos, rent, countdown and landlord rules shown upfront." />
            <Step step={2} icon="🔒" title="Pay ₦3,000 inspection fee"
              body="Locks your slot. Ambassador contacts you to arrange the inspection date on WhatsApp." />
            <Step step={3} icon="🏠" title="Inspect the property"
              body="Ambassador escorts you to the property. No random strangers — a verified CorperNest rep is present." />
            <Step step={4} icon="✅" title="Move in"
              body="Happy? Pay the facilitation fee, sign with the landlord and move in. Exact address only revealed after payment." />
          </div>
        </div>

        {/* ── EARNINGS TABLE ── */}
        <div>
          <SectionTitle>Property Facilitation Fee</SectionTitle>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              padding: "10px 14px", backgroundColor: "var(--color-primary)",
            }}>
              {["Annual rent", "Facilitation fee (10%)", "Fee arrangement"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#fff", textAlign: h === "Fee arrangement" ? "right" : h === "Facilitation fee (10%)" ? "center" : "left" }}>{h}</span>
              ))}
            </div>
            {[
              { rent: "₦150,000", fee: "₦15,000", earn: "Handled outside CorperNest" },
              { rent: "₦200,000", fee: "₦20,000", earn: "Handled outside CorperNest" },
              { rent: "₦300,000", fee: "₦30,000", earn: "Handled outside CorperNest" },
              { rent: "₦500,000", fee: "₦50,000", earn: "Handled outside CorperNest" },
            ].map((row, i, arr) => (
              <div key={row.rent} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                padding: "11px 14px",
                backgroundColor: i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)",
                borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
              }}>
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.rent}/yr</span>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{row.fee}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", textAlign: "right" }}>{row.earn}</span>
              </div>
            ))}
            <div style={{ padding: "8px 14px", backgroundColor: "var(--color-light)" }}>
              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
                The Property Facilitation Fee is 10% of annual rent. Payment arrangements are handled outside CorperNest.
              </p>
            </div>
          </div>
        </div>

        {/* ── LOCATION AMBASSADOR ── */}
        <div style={{
          borderRadius: 14, padding: "14px 16px",
          backgroundColor: "var(--color-light)",
          border: "1px solid var(--color-border)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 6px" }}>
            👤 What is a Location Ambassador?
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 10px", lineHeight: 1.6 }}>
            Every listing gets a verified CorperNest Ambassador assigned to that area. They call the outgoing tenant to verify the listing, escort incoming tenants to inspections and confirm key handovers — so both parties are protected.
          </p>
          <button onClick={() => router.push("/parkout/ambassador/apply")}
            style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: "1.5px solid var(--color-primary)", backgroundColor: "transparent",
              color: "var(--color-primary)", cursor: "pointer",
            }}>
            Apply to be an Ambassador →
          </button>
        </div>

        {/* ── PAYMENT GUARANTEE NOTICE ── */}
        <div style={{
          borderRadius: 14, padding: "14px 16px",
          backgroundColor: "#FFF8E1", border: "1px solid #FAC775",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: "0 0 6px" }}>
            ⚠️ How is the facilitation arrangement handled?
          </p>
          <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.65 }}>
            The Property Facilitation Fee is 10% of the annual rent. Any payment arrangements between the relevant parties are handled outside CorperNest.
          </p>
          <div style={{ marginTop: 8 }}>
            {[
              "The facilitation fee is based on 10% of annual rent",
              "Payment arrangements are handled outside CorperNest",
              "CorperNest does not process the facilitation payment",
            ].map((item) => (
              <p key={item} style={{ fontSize: 11, color: "#92400E", margin: "3px 0", paddingLeft: 10 }}>
                → {item}
              </p>
            ))}
          </div>
        </div>

        {/* ── PROTECTION ── */}
        <div style={{
          borderRadius: 14, padding: "14px 16px",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🛡️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
              Protected by CorperNest
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
              Payments processed through CorperNest are handled securely via Paystack. Exact address access follows the applicable Park-Out process.
            </p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => router.push("/parkout/new")}
            style={{
              width: "100%", padding: "15px", borderRadius: 14,
              border: "none", backgroundColor: "var(--color-primary)",
              color: "#fff", fontFamily: "var(--font-heading)",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
            🏠 List my room and start earning
          </button>
          <button onClick={() => router.back()}
            style={{
              width: "100%", padding: "13px", borderRadius: 14,
              border: "1.5px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
            ← Back to Park-Out
          </button>
        </div>

      </div>
    </div>
  );
}