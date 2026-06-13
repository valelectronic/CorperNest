"use client";

import Link from "next/link";

function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <span style={{
      fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800,
      color: variant === "light" ? "#fff" : "var(--color-primary)", letterSpacing: "-0.5px",
    }}>
      Corper<span style={{ color: "var(--color-action)", fontStyle: "italic" }}>Nest</span>
    </span>
  );
}

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Browse verified listings",
    body: "Every property on CorperNest is reviewed by our team before it goes live. No fake listings, no bait-and-switch.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="var(--color-primary)" strokeWidth="1.8" />
        <path d="M21 21l-4.35-4.35" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Pay ₦5,000 to book an agent tour",
    body: "The inspection fee connects you to a verified agent who will take you around — not just one property, but all their available options in one trip. You only pay once per agent.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-primary)" strokeWidth="1.8" />
        <path d="M2 10h20" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Tour properties, pick what you like",
    body: "Meet the agent, inspect the properties in person, and choose the one that works for you. No pressure, no hidden fees.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Move in with confidence",
    body: "Your visit is verified with a unique code on the day. No ghost agents, no money sent to strangers — just a clean, safe process from browse to move-in.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const TRUST_POINTS = [
  {
    q: "What is the ₦5,000 for?",
    a: "It's an inspection fee — not rent, not a deposit. It covers the agent's time to take you around and show you available properties. You pay once and tour everything they have.",
  },
  {
    q: "What if I don't like any property?",
    a: "You're under no obligation to rent. The fee covers the tour, not the rent. If nothing suits you, you simply don't proceed — and you can book a different agent.",
  },
  {
    q: "How do I know the agent is real?",
    a: "Every agent on CorperNest goes through identity verification before they can list properties. You'll see a verified badge on their profile.",
  },
  {
    q: "Is my money safe?",
    a: "Payments are processed by Paystack — one of Nigeria's most trusted payment companies. We never ask you to send money directly to an agent.",
  },
];

export default function LandingPageClient() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh" }}>

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-card)", position: "sticky", top: 0, zIndex: 30 }}>
          <Logo variant="dark" />
          <Link href="/signin" style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 12, border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)", textDecoration: "none" }}>
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <div style={{ padding: "28px 20px 0" }}>

          {/* Live badge — EKET */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-action)", display: "inline-block", animation: "pulse 2s infinite" }} />
              Now live in Eket, Akwa Ibom
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 900, color: "var(--color-header)", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 12 }}>
            Find a property.{" "}
            <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>No scams.</span>
          </h1>

          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: 24 }}>
            Pay ₦5,000 once, meet a verified agent in Eket, and tour all their available properties in one trip. Move in with confidence.
          </p>

          <Link href="/properties" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "15px", backgroundColor: "var(--color-action)", color: "#fff", borderRadius: 16, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
            </svg>
            Browse listings — no signup needed
          </Link>

          <Link href="/signup" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "15px", backgroundColor: "var(--color-light)", color: "var(--color-primary)", borderRadius: 16, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, textDecoration: "none", border: "1.5px solid var(--color-border)", marginBottom: 32 }}>
            Create free account →
          </Link>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--color-border)", borderRadius: 16, overflow: "hidden", marginBottom: 40 }}>
            {[
              { value: "100%", label: "Verified listings" },
              { value: "₦5k",  label: "Flat fee, one tour" },
              { value: "0",    label: "Scam reports" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--color-card)", padding: "14px 8px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 900, color: "var(--color-primary)", margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: "0 20px 40px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>
            How it works
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ background: "var(--color-card)", borderRadius: 16, padding: "16px", border: "1px solid var(--color-border)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--color-action)" }}>{step.num}</span>
                    <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: 0 }}>{step.title}</p>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust / FAQ */}
        <div style={{ padding: "0 20px 40px", background: "var(--color-card)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "24px 0 16px" }}>
            Common questions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {TRUST_POINTS.map((t, i) => (
              <div key={i}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: "0 0 5px" }}>{t.q}</p>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>{t.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: "24px 20px 40px", textAlign: "center" }}>
          <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", backgroundColor: "var(--color-primary)", color: "#fff", borderRadius: 16, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
            Browse listings now →
          </Link>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Already have an account?{" "}
            <Link href="/signin" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <div className="hidden md:block">

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 64px", borderBottom: "1px solid var(--color-border)", background: "var(--color-card)", position: "sticky", top: 0, zIndex: 30 }}>
          <Logo variant="dark" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/properties" style={{ fontSize: 13, fontWeight: 700, padding: "9px 18px", color: "#fff", textDecoration: "none", borderRadius: 12, background: "var(--color-action)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
              </svg>
              Browse listings
            </Link>
            <Link href="/signin" style={{ fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 12, border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)", textDecoration: "none" }}>
              Sign in
            </Link>
            <Link href="/signup" style={{ fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 12, backgroundColor: "var(--color-light)", color: "var(--color-primary)", textDecoration: "none", fontFamily: "var(--font-heading)", border: "1.5px solid var(--color-border)" }}>
              Create account
            </Link>
          </div>
        </nav>

        {/* Desktop hero */}
        <div style={{ display: "flex", minHeight: "calc(100dvh - 65px)" }}>

          {/* Left */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px", maxWidth: 660 }}>
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 999, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", color: "var(--color-primary)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--color-action)", display: "inline-block" }} />
                Now live in Eket, Akwa Ibom · More cities coming soon
              </span>
            </div>

            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(44px, 4.5vw, 60px)", fontWeight: 900, color: "var(--color-header)", letterSpacing: "-2px", lineHeight: 1.05, marginBottom: 20 }}>
              Find a property.{" "}
              <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>Zero scams.</span>
            </h1>

            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Pay ₦5,000 once to book a verified agent in Eket. They'll take you around — one trip, multiple properties — until you find the right one. No fake listings, no money to strangers.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
              <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", backgroundColor: "var(--color-action)", color: "#fff", borderRadius: 16, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
                </svg>
                Browse listings — no signup
              </Link>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "14px 28px", border: "1.5px solid var(--color-border)", color: "var(--color-primary)", borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none", background: "var(--color-light)", fontFamily: "var(--font-heading)" }}>
                Create free account →
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[
                { value: "100%",   label: "Verified listings" },
                { value: "₦5,000", label: "One fee, full agent tour" },
                { value: "0",      label: "Scam reports" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  {i > 0 && <div style={{ width: 1, height: 32, backgroundColor: "var(--color-border)" }} />}
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "var(--color-primary)", margin: 0 }}>{stat.value}</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div style={{ width: 360, margin: "32px 64px 32px 0", borderRadius: 24, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", padding: 28, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 4px 24px rgba(46,125,50,0.07)", alignSelf: "center" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>Find your next home in Eket</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              Browse verified listings or create an account to book an agent tour.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <Link href="/properties" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", backgroundColor: "var(--color-action)", color: "#fff", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
                </svg>
                Browse listings — no signup
              </Link>
              <Link href="/signup" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px", border: "1.5px solid var(--color-border)", color: "var(--color-primary)", borderRadius: 14, fontWeight: 700, fontSize: 14, textDecoration: "none", background: "var(--color-light)", fontFamily: "var(--font-heading)" }}>
                Create free account →
              </Link>
              <Link href="/signin" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", color: "var(--color-text-muted)", borderRadius: 14, fontWeight: 500, fontSize: 13, textDecoration: "none" }}>
                I already have an account
              </Link>
            </div>

            {/* How it works mini */}
            <div style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "14px 16px" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--color-text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>
                How it works
              </p>
              {[
                "Browse verified listings in Eket",
                "Pay ₦5,000 — agent tours you around",
                "Visit multiple properties in one trip",
                "Move in with full confidence",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--color-action)", flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works full section */}
        <div style={{ background: "var(--color-card)", borderTop: "1px solid var(--color-border)", padding: "64px 64px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ marginBottom: 48, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                The process
              </p>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 900, color: "var(--color-header)", margin: 0, letterSpacing: "-1px" }}>
                How CorperNest works
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} style={{ background: "var(--color-bg)", borderRadius: 20, padding: 24, border: "1px solid var(--color-border)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    {step.icon}
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--color-action)", display: "block", marginBottom: 6 }}>{step.num}</span>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 8px" }}>{step.title}</p>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust / FAQ */}
        <div style={{ padding: "64px 64px", background: "var(--color-bg)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ marginBottom: 40, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                Transparency
              </p>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 900, color: "var(--color-header)", margin: 0, letterSpacing: "-1px" }}>
                Common questions
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {TRUST_POINTS.map((t, i) => (
                <div key={i} style={{ background: "var(--color-card)", borderRadius: 18, padding: "24px", border: "1px solid var(--color-border)" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 10px" }}>{t.q}</p>
                  <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>{t.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ background: "#1B2E1B", padding: "56px 64px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 32, fontWeight: 900, color: "#E8F5E9", margin: "0 0 12px", letterSpacing: "-1px" }}>
            Ready to find your home in Eket?
          </h2>
          <p style={{ fontSize: 15, color: "#7A9A7A", margin: "0 0 32px" }}>
            Browse verified listings in Eket, Akwa Ibom — no account needed.
          </p>
          <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", backgroundColor: "var(--color-action)", color: "#fff", borderRadius: 16, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Browse listings →
          </Link>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}