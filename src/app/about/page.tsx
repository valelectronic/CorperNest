// src/app/about/page.tsx
"use client";

import Link from "next/link";

const VALUES = [
  {
    title: "Verification first",
    body:  "Nothing goes live without our team reviewing it. Every listing, every agent, every seller — checked before any client sees them.",
    icon:  "🔍",
  },
  {
    title: "Human connection",
    body:  "We call every client personally before confirming their inspection. A platform shouldn't replace a phone call when someone is making a housing decision.",
    icon:  "📞",
  },
  {
    title: "Transparent process",
    body:  "No hidden fees, no vague terms. The client knows exactly what happens at each step before they agree to anything.",
    icon:  "✓",
  },
  {
    title: "Accountability",
    body:  "Every agent has their real identity on file with us. Every booking and every transaction has a digital record. If something goes wrong, we can follow up.",
    icon:  "🛡️",
  },
];

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", color: "var(--color-text)" }}>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(160deg, #1B2E1B 0%, #2E4A2E 100%)", padding: "64px 20px 56px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#A5D6A7", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            About CorperNest
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px, 7vw, 42px)", fontWeight: 900, color: "#fff", margin: "0 0 20px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            We believe housing and commerce should be something you can trust.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, margin: 0 }}>
            CorperNest is a verified housing and marketplace platform operating in Eket, Akwa Ibom. We connect renters with real identity-checked agents, and buyers with verified sellers, staying involved in every transaction from start to finish.
          </p>
        </div>
      </div>

      {/* ── MISSION ── */}
      <section style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
            Our mission
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, color: "var(--color-header)", margin: "0 0 20px", lineHeight: 1.3 }}>
            End the scam cycle in Nigerian local markets, housing and commerce alike.
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 16px" }}>
            In most Nigerian cities, finding accommodation means scrolling through WhatsApp groups, trusting strangers online, and paying money upfront for properties you've never seen. Buying or selling items carries the same risk, fake buyers, sellers who disappear after payment, and no one to turn to when things go wrong.
          </p>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 16px" }}>
  CorperNest was built to fix both problems, starting with Eket. By verifying every agent's identity and reviewing every listing before it goes live, we give renters a foundation of trust they can't get anywhere else. By processing marketplace orders through our verified checkout system, we protect both sides of every sale.
</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-header)", lineHeight: 1.8, margin: 0, padding: "16px", background: "var(--color-light)", borderRadius: 12, borderLeft: "3px solid var(--color-primary)" }}>
            We're not competing with Facebook or WhatsApp. We're solving the problem they created, because posting a listing or selling an item on social media is free, which means anyone can do it, including people with no intention of delivering.
          </p>
        </div>
      </section>

      {/* ── HOW WE'RE DIFFERENT ── */}
      <section style={{ background: "var(--color-light)", padding: "56px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", textAlign: "center" }}>
            What makes us different
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--color-header)", margin: "0 0 32px", textAlign: "center", lineHeight: 1.3 }}>
            Not a listing board. A verified connection.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                heading: "We verify, not just list",
                body: "Anyone can post a listing on Facebook or WhatsApp. On CorperNest, every property listing is reviewed by our team before it goes live. Every marketplace seller is a registered verified user. If something is wrong, we fix it or reject it before anyone sees it.",
              },
              {
                heading: "We call you before connecting you",
                body: "When you request a property inspection, we call you personally to confirm the details, explain how the process works, and connect you to the agent. You are never sent to a stranger without us speaking to you first.",
              },
              {
              heading: "Secure payment & order protection",
              body: "When buying or selling an item on CorperNest, payments are processed securely with verified order tracking and buyer protection. Both sides are protected throughout the purchase.",
            },
              {
                heading: "Inspections are free to book",
                body: "Booking a property inspection through CorperNest costs nothing. You pay the agent their inspection fee directly when you meet them in person. CorperNest charges agents a small platform commission after a confirmed visit.",
              },
              {
                heading: "Every transaction is recorded",
                body: "After meeting an agent or completing a marketplace sale, the transaction is confirmed through our platform. This creates a permanent record — who showed what, when, and where. If a dispute ever arises, that record exists.",
              },
            ].map((item, i) => (
              <div key={i} style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0, marginTop: 7 }} />
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 8px" }}>
                      {item.heading}
                    </p>
                    <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--color-header)", margin: "0 0 32px", textAlign: "center" }}>
            What we stand for
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{ background: "var(--color-light)", border: "1px solid var(--color-border)", borderRadius: 14, padding: "18px" }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 10 }}>{v.icon}</span>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 8px" }}>
                  {v.title}
                </p>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.65 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL ── */}
      <section style={{ background: "var(--color-light)", padding: "40px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 8px" }}>
            CorperNest is a registered Nigerian company.
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-header)", margin: "0 0 16px" }}>
            Bridgenest Limited · RC 9630078
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Currently operating in Eket, Akwa Ibom. Expanding to more cities soon.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "56px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--color-header)", margin: "0 0 14px" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 24px", lineHeight: 1.7 }}>
            Find verified housing, or buy and sell items safely — all in one place.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/home" style={{ padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--color-primary)", color: "#fff", textDecoration: "none" }}>
              Browse housing
            </Link>
            <Link href="/marketplace" style={{ padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--color-header)", color: "#fff", textDecoration: "none" }}>
              Browse marketplace
            </Link>
            <Link href="/" style={{ padding: "13px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--color-bg)", color: "var(--color-text-muted)", textDecoration: "none", border: "1px solid var(--color-border)", width: "100%" }}>
              Back to home
            </Link>
          </div>

          {/* Social links */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Follow us
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="https://x.com/_Corpernest" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", textDecoration: "none", color: "var(--color-text)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>@_Corpernest</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}