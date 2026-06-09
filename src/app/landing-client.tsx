"use client";

import Link from "next/link";
import Image from "next/image";

function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: 20,
        fontWeight: 800,
        color: variant === "light" ? "#fff" : "var(--color-primary)",
        letterSpacing: "-0.5px",
      }}
    >
      Corper<span style={{ color: "var(--color-action)", fontStyle: "italic" }}>Nest</span>
    </span>
  );
}

export default function LandingPageClient() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg)" }}
    >

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="flex flex-col min-h-screen md:hidden">

        {/* Nav */}
        <nav
          className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-card)" }}
        >
          <Logo variant="dark" />
          <Link
            href="/signin"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 12,
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col px-5 pt-8 pb-4">

          {/* Live badge */}
          <div className="mb-5">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "var(--color-light)",
                border: "1px solid var(--color-border)",
                color: "var(--color-primary)",
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
              fontSize: 36,
              fontWeight: 900,
              color: "var(--color-header)",
              letterSpacing: "-1px",
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Rent or buy a property.{" "}
            <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>
              No scams.
            </span>
          </h1>

          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: 28 }}>
            Every listing is verified before it goes live. Pay ₦5,000, meet the agent, move in with confidence.
          </p>

          {/* Browse listings — PRIMARY CTA on mobile, very visible */}
          <Link
            href="/properties"
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
            </svg>
            Browse listings — no signup needed
          </Link>

          {/* Create account — secondary */}
          <Link
            href="/signup"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "15px",
              backgroundColor: "var(--color-light)",
              color: "var(--color-primary)",
              borderRadius: 16,
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              border: "1.5px solid var(--color-border)",
              marginBottom: 24,
            }}
          >
            Create free account →
          </Link>

          {/* 3 steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Browse verified listings in your state",
              "Pay ₦5,000 inspection fee to meet the agent",
              "Visit the property and move in",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "var(--color-card)", borderRadius: 14, border: "1px solid var(--color-border)" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-action)",
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  0{i + 1}
                </span>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom signin nudge */}
        <div
          style={{
            padding: "16px 20px 36px",
            textAlign: "center",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-card)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Already have an account?{" "}
            <Link href="/signin" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen flex-col">

        {/* Desktop nav */}
        <nav
          className="flex items-center justify-between px-16 py-5"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-card)" }}
        >
          <Logo variant="dark" />
          <div className="flex items-center gap-3">
            <Link
              href="/properties"
              style={{
                fontSize: 13, fontWeight: 700, padding: "9px 18px",
                color: "#fff", textDecoration: "none", borderRadius: 12,
                background: "var(--color-action)",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
              </svg>
              Browse listings
            </Link>
            <Link
              href="/signin"
              style={{
                fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 12,
                border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 12,
                backgroundColor: "var(--color-light)", color: "var(--color-primary)",
                textDecoration: "none", fontFamily: "var(--font-heading)",
                border: "1.5px solid var(--color-border)",
              }}
            >
              Create account
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
                  fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                  backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)",
                  color: "var(--color-primary)",
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
                fontSize: "clamp(48px, 5vw, 64px)",
                fontWeight: 900,
                color: "var(--color-header)",
                letterSpacing: "-2px",
                lineHeight: 1.05,
                marginBottom: 20,
              }}
            >
              Rent or buy a property.{" "}
              <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>
                Zero scams.
              </span>
            </h1>

            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              CorperNest verifies every listing before it goes live. Pay a small inspection fee, meet the agent in person, and move in with full confidence.
            </p>

            {/* Browse first — most prominent CTA */}
            <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
              <Link
                href="/properties"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", backgroundColor: "var(--color-action)",
                  color: "#fff", borderRadius: 16, fontFamily: "var(--font-heading)",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
                </svg>
                Browse listings — no signup
              </Link>
              <Link
                href="/signup"
                style={{
                  display: "inline-flex", alignItems: "center", padding: "14px 28px",
                  border: "1.5px solid var(--color-border)", color: "var(--color-primary)",
                  borderRadius: 16, fontWeight: 700, fontSize: 14, textDecoration: "none",
                  background: "var(--color-light)", fontFamily: "var(--font-heading)",
                }}
              >
                Create free account →
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[
                { value: "100%", label: "Verified listings" },
                { value: "₦5,000", label: "Flat inspection fee" },
                { value: "0", label: "Scam reports" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  {i > 0 && (
                    <div style={{ width: 1, height: 32, backgroundColor: "var(--color-border)" }} />
                  )}
                  <div>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "var(--color-primary)", margin: 0 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "2px 0 0" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — action card */}
          <div
            style={{
              width: 340, margin: "32px 64px 32px 0", borderRadius: 24,
              backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)",
              padding: 28, display: "flex", flexDirection: "column", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(46,125,50,0.07)",
            }}
          >
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-header)", margin: "0 0 6px" }}>
              Find your property
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>
              Browse verified listings or create an account to book an inspection.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {/* Browse — top and most prominent */}
              <Link
                href="/properties"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px", backgroundColor: "var(--color-action)", color: "#fff",
                  borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700,
                  fontSize: 14, textDecoration: "none",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
                </svg>
                Browse listings — no signup
              </Link>
              <Link
                href="/signup"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "14px", border: "1.5px solid var(--color-border)",
                  color: "var(--color-primary)", borderRadius: 14, fontWeight: 700,
                  fontSize: 14, textDecoration: "none", background: "var(--color-light)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Create free account →
              </Link>
              <Link
                href="/signin"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "12px", color: "var(--color-text-muted)", borderRadius: 14,
                  fontWeight: 500, fontSize: 13, textDecoration: "none",
                }}
              >
                I already have an account
              </Link>
            </div>

            {/* How it works */}
            <div
              style={{
                backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)",
                borderRadius: 16, padding: "14px 16px",
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