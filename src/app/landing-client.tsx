"use client";

import Link from "next/link";
import Image from "next/image";


function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  // Once you have the files, replace this entire component with:
  //
   <Image
    src={variant === "light" ? "/corperNestLogo.png" : "/favicon-32x32.png"}
   alt="CoperNest"
    width={130}
    height={36}
   style={{ objectFit: "contain" }}
    priority
 />

  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: 20,
        fontWeight: 800,
        color: variant === "light" ? "#E8F5E9" : "var(--color-primary)",
        letterSpacing: "-0.5px",
      }}
    >
      Corper<span style={{ color: "var(--color-action)", fontStyle: "italic" }}>Nest</span>
    </span>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

export default function LandingPageClient() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-header)" }}
    >

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="flex flex-col min-h-screen md:hidden">

        {/* Nav */}
        <nav className="flex items-center justify-between px-5 pt-6 pb-2">
          <Logo variant="light" />
          <Link
            href="/signin"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 12,
              border: "1px solid rgba(67,160,71,0.5)",
              color: "var(--color-action)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col px-5 pt-10 pb-6">

          {/* Live badge */}
          <div className="mb-6">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(67,160,71,0.12)",
                border: "1px solid rgba(67,160,71,0.3)",
                color: "var(--color-action)",
              }}
            >
              <span
                className="animate-pulse"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-action)",
                  display: "inline-block",
                }}
              />
              Now live in Akwa Ibom
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 38,
              fontWeight: 900,
              color: "#E8F5E9",
              letterSpacing: "-1px",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Rent/buy a 
            home.{" "}
            <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>
              No scams.
            </span>
          </h1>

          <p style={{ fontSize: 14, color: "#A5C8A5", lineHeight: 1.65, marginBottom: 32, maxWidth: 300 }}>
            Every listing is verified before it goes live. Pay ₦5,000, meet the agent, move in with confidence.
          </p>

          {/* 3 steps — simple list, no duplication */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
            {[
              "Browse verified listings in your state",
              "Pay ₦5,000 inspection fee to meet the agent",
              "Visit the property and move in",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-action)",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <p style={{ fontSize: 13, color: "#A5C8A5", margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          style={{
            backgroundColor: "var(--color-card)",
            borderRadius: "24px 24px 0 0",
            padding: "20px 20px 40px",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 20px" }} />

          <Link
            href="/signup"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "15px",
              backgroundColor: "var(--color-action)",
              color: "#fff",
              borderRadius: 16,
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              marginBottom: 10,
            }}
          >
            Create free account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <Link
            href="/signin"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "15px",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              borderRadius: 16,
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              marginBottom: 14,
            }}
          >
            I already have an account
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
            </svg>
            <Link href="/properties" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>
              Browse listings without signing up
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen flex-col">

        {/* Desktop nav */}
        <nav
          className="flex items-center justify-between px-16 py-5"
          style={{ borderBottom: "1px solid rgba(67,160,71,0.1)" }}
        >
          <Logo variant="light" />
          <div className="flex items-center gap-3">
            <Link
              href="/properties"
              style={{ fontSize: 13, fontWeight: 500, padding: "8px 14px", color: "#A5C8A5", textDecoration: "none", borderRadius: 10 }}
            >
              Browse listings
            </Link>
            <Link
              href="/signin"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: 12,
                border: "1px solid rgba(67,160,71,0.5)",
                color: "var(--color-action)",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 12,
                backgroundColor: "var(--color-action)",
                color: "#fff",
                textDecoration: "none",
                fontFamily: "var(--font-heading)",
              }}
            >
              Get started free
            </Link>
          </div>
        </nav>

        {/* Desktop hero */}
        <div className="flex flex-1">

          {/* Left */}
          <div className="flex-1 flex flex-col justify-center px-16 py-16" style={{ maxWidth: 640 }}>

            <div style={{ marginBottom: 24 }}>
              <span
                className="inline-flex items-center gap-2"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "7px 14px",
                  borderRadius: 999,
                  backgroundColor: "rgba(67,160,71,0.12)",
                  border: "1px solid rgba(67,160,71,0.3)",
                  color: "var(--color-action)",
                }}
              >
                <span
                  className="animate-pulse"
                  style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--color-action)", display: "inline-block" }}
                />
                Now live in Akwa Ibom · More states coming soon
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(48px, 5vw, 68px)",
                fontWeight: 900,
                color: "#E8F5E9",
                letterSpacing: "-2px",
                lineHeight: 1.05,
                marginBottom: 20,
              }}
            >
              Rent/buy a home.{" "}
              <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>
                Zero scams.
              </span>
            </h1>

            <p style={{ fontSize: 16, color: "#A5C8A5", lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
              CorperNest verifies every listing before it goes live. Pay a small inspection fee, meet the agent in person, and move in with full confidence.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
              <Link
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  backgroundColor: "var(--color-action)",
                  color: "#fff",
                  borderRadius: 16,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Create free account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/properties"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 28px",
                  border: "1.5px solid rgba(67,160,71,0.4)",
                  color: "#A5C8A5",
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Browse listings
              </Link>
            </div>

            {/* Stats — desktop only, single row */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[
                { value: "100%", label: "Verified listings" },
                { value: "₦5,000", label: "Flat inspection fee" },
                { value: "0", label: "Scam reports" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  {i > 0 && (
                    <div style={{ width: 1, height: 32, backgroundColor: "rgba(67,160,71,0.2)" }} />
                  )}
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#E8F5E9", margin: 0 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, color: "#7A9A7A", margin: "2px 0 0" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — action card */}
          <div
            style={{
              width: 340,
              margin: "32px 48px 32px 0",
              borderRadius: 24,
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: "0 0 6px" }}>
              Find your home
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
              Join corpers who found verified housing through CorperNest.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <Link
                href="/signup"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px",
                  backgroundColor: "var(--color-action)",
                  color: "#fff",
                  borderRadius: 14,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Create free account →
              </Link>
              <Link
                href="/signin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px",
                  border: "1.5px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                  borderRadius: 14,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                I have an account
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="var(--color-text-muted)" strokeWidth="1.8" />
                  <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
                </svg>
                <Link href="/properties" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>
                  Browse without signing up
                </Link>
              </div>
            </div>

            {/* How it works */}
            <div
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--color-text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>
                How it works
              </p>
              {[
                "Browse verified listings",
                "Pay ₦5,000 inspection fee",
                "Visit, confirm, move in",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--color-action)", width: 20, flexShrink: 0 }}>
                    0{i + 1}
                  </span>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}