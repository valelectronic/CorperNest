// src/app/landing-client.tsx
"use client";

import Link from "next/link";

export default function LandingClient() {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "#fff", color: "#111", minHeight: "100dvh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#fff", borderBottom: "1px solid #E8F0E8",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#1B5E20" }}>
          Corper<span style={{ color: "#43A047", fontStyle: "italic" }}>Nest</span>
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/signin" style={{
            padding: "8px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600,
            color: "#1B5E20", textDecoration: "none",
            border: "1.5px solid #1B5E20",
          }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            padding: "8px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600,
            color: "#fff", textDecoration: "none",
            background: "#1B5E20",
          }}>
            Sign up
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "40px 20px 32px", maxWidth: 540, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E8F5E9", borderRadius: 50, padding: "7px 16px", marginBottom: 20,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#43A047" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>
            Live in Eket, Akwa Ibom · Expanding across Nigeria
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(34px, 9vw, 50px)",
          fontWeight: 900, color: "#0D1F0D", margin: "0 0 14px",
          lineHeight: 1.08, letterSpacing: "-0.02em",
        }}>
          Verified housing.<br />
          Safe marketplace.{" "}
          <span style={{ color: "#43A047", fontStyle: "italic" }}>No scams.</span>
        </h1>

        {/* Changed: "escrow payments" → "secure checkout" */}
        <p style={{ fontSize: 15, color: "#444", lineHeight: 1.75, margin: "0 0 28px", maxWidth: 420 }}>
          CorperNest helps Nigerians relocating to new cities find verified housing and buy or sell items safely, with secure checkout and verified agents protecting every transaction.
        </p>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid #E8F0E8", borderBottom: "1px solid #E8F0E8",
          padding: "18px 0", marginBottom: 32,
        }}>
          {[
            { val: "100%", label: "Verified agents"   },
            { val: "Free", label: "To inspect"        },
            { val: "0",    label: "Scam reports"      },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center",
              borderRight: i < 2 ? "1px solid #E8F0E8" : "none",
            }}>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "#1B5E20", margin: 0, lineHeight: 1 }}>
                {s.val}
              </p>
              <p style={{ fontSize: 11, color: "#888", margin: "5px 0 0", lineHeight: 1.4 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TWO SERVICES ── */}
      <section style={{ padding: "0 20px 40px", maxWidth: 540, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
          What we offer
        </p>

        {/* Housing card */}
        <div style={{
          border: "1.5px solid #C8E6C9", borderRadius: 20,
          padding: "20px", marginBottom: 12, background: "#fff",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#2E7D32" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "#0D1F0D", margin: "0 0 4px" }}>
                Find Verified Housing
              </p>
              <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.65 }}>
                Every listing is reviewed before going live. Book a free inspection, meet a verified agent, and see all their available properties in one visit. Pay the agent directly, nothing to us before you see the property.
              </p>
            </div>
          </div>
          <Link href="/home" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: "#1B5E20", color: "#fff", textDecoration: "none",
          }}>
            Browse listings — free inspection
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Marketplace card — Changed: "Buy & Sell via Escrow" → "Buy & Sell Securely" */}
        <div style={{
          border: "1.5px solid #E8F0E8", borderRadius: 20,
          padding: "20px", background: "#fff",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#2E7D32" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "#0D1F0D", margin: "0 0 4px" }}>
                Buy &amp; Sell Securely
              </p>
              {/* Changed: "held in escrow" → "buyer protection guarantee" */}
              <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.65 }}>
                Selling items before relocating? Buying something locally? Every order is backed by our buyer protection guarantee and verified merchant fulfilment. Safe transactions, zero scams, total peace of mind.
              </p>
            </div>
          </div>
          <Link href="/marketplace" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: "#1B5E20", color: "#fff", textDecoration: "none",
          }}>
            Browse marketplace
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── WHY CORPERNEST ── */}
      <section style={{ padding: "0 20px 40px", maxWidth: 540, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
          Why CorperNest
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              icon: "🔒",
              // Changed: "Escrow payments" → "Secure Checkout"
              title: "Secure Checkout",
              // Changed: "held safely" → "buyer protection and transparent return coverage"
              body:  "For marketplace purchases, all orders are backed by full buyer protection and transparent return coverage for a risk-free experience.",
            },
            {
              icon: "✅",
              title: "Verified agents and sellers",
              body:  "Every agent goes through KYC before listing. Every marketplace seller is a registered user. No anonymous listings.",
            },
            {
              icon: "🚫",
              title: "Zero tolerance for scams",
              body:  "We have had zero scam reports since launch. If anything goes wrong, we step in — refunds for buyers, protection for sellers.",
            },
            {
              icon: "📍",
              title: "Built for people relocating",
              body:  "Whether you are starting NYSC or moving for work — CorperNest is designed for people arriving in a new city who don't know who to trust.",
            },
          ].map((item) => (
            <div key={item.title} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              background: "#fff", border: "1px solid #E8F0E8",
              borderRadius: 16, padding: "16px",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "#0D1F0D", margin: "0 0 4px" }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.65 }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "0 20px 48px", maxWidth: 540, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, #1B2E1B 0%, #2E4A2E 100%)",
          borderRadius: 20, padding: "28px 20px", textAlign: "center",
        }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 20px", lineHeight: 1.6 }}>
            Create a free account. Browse verified listings. Buy or sell safely. No credit card required.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: 14, fontSize: 14, fontWeight: 700,
            background: "#fff", color: "#1B5E20", textDecoration: "none",
          }}>
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #E8F0E8", padding: "20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }}>
          <Link href="/about"       style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>About</Link>
          <Link href="/home"        style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Housing</Link>
          <Link href="/marketplace" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Marketplace</Link>
          <Link href="/signin"      style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Sign in</Link>
          <Link href="/terms" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Terms</Link>
        </div>
        <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>
          © {new Date().getFullYear()} Bridgenest Limited · RC 9630078
        </p>
      </footer>

    </div>
  );
}