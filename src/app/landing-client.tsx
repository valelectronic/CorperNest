"use client";

import Link from "next/link";

// TODO: Replace <LogoMark /> with your actual logo when ready.
// Steps:
// 1. Add logo file to /public/logo.svg (or .png)
// 2. Import: import Image from "next/image"
// 3. Replace <LogoMark /> with:
//    <Image src="/logo.svg" alt="CorperNest" width={48} height={48} />

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center"
        style={{ width: "48px", height: "48px" }}>
        <div className="absolute inset-0 rounded-2xl"
          style={{ border: "2px solid rgba(67,160,71,0.6)", transform: "rotate(8deg)" }} />
        <div className="absolute inset-1 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--color-action)" }}>
          <span className="text-lg font-black text-white"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-1px" }}>
            CN
          </span>
        </div>
      </div>
      <div>
        <p className="text-xl font-black tracking-tight leading-none"
          style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
          Corper<span style={{ color: "var(--color-action)" }}>Nest</span>
        </p>
        <p className="text-xs leading-none mt-0.5"
          style={{ color: "#7A9A7A", letterSpacing: "1.5px" }}>
          VERIFIED HOUSING
        </p>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black"
        style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "#7A9A7A" }}>{label}</p>
    </div>
  );
}

export default function LandingPageClient() {
  return (
    <div className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-header)" }}>

      {/* ══════════════════════════════════════
          MOBILE LAYOUT
      ══════════════════════════════════════ */}
      <div className="flex flex-col min-h-screen md:hidden">

        {/* Top nav */}
        <nav className="flex items-center justify-between px-5 pt-6 pb-2">
          <LogoMark />
          <Link href="/signin"
            className="text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ border: "1px solid rgba(67,160,71,0.5)", color: "var(--color-action)" }}>
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col px-5 pt-8 pb-6">

          {/* Live badge */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(67,160,71,0.12)",
                border: "1px solid rgba(67,160,71,0.3)",
                color: "var(--color-action)",
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-action)" }} />
              Now live in Akwa Ibom
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black leading-tight mb-4"
            style={{
              color: "#E8F5E9",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-1px",
            }}>
            Find your<br />
            <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>verified</span><br />
            corper home.
          </h1>

          <p className="text-sm leading-relaxed mb-8"
            style={{ color: "#A5C8A5", maxWidth: "300px" }}>
            No scams. No surprises. Every listing verified
            by CorperNest before you see it.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-5 mb-8 rounded-2xl px-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(67,160,71,0.15)",
            }}>
            <StatItem value="100%" label="Verified" />
            <div className="w-px" style={{ backgroundColor: "rgba(67,160,71,0.2)" }} />
            <StatItem value="₦5k" label="Inspection" />
            <div className="w-px" style={{ backgroundColor: "rgba(67,160,71,0.2)" }} />
            <StatItem value="0" label="Scams" />
          </div>

          {/* How it works */}
          <div className="space-y-3 mb-8">
            {[
              { step: "01", text: "Browse verified listings in your state" },
              { step: "02", text: "Pay ₦5,000 inspection fee to unlock agent contact" },
              { step: "03", text: "Visit the property, move in with confidence" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="text-xs font-black shrink-0 mt-0.5"
                  style={{ color: "var(--color-action)", fontFamily: "var(--font-mono)" }}>
                  {item.step}
                </span>
                <p className="text-sm" style={{ color: "#A5C8A5" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom action sheet */}
        <div className="px-5 pt-7 pb-10 rounded-t-3xl space-y-3"
          style={{
            backgroundColor: "var(--color-card)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          }}>
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 rounded-full"
              style={{ backgroundColor: "var(--color-border)" }} />
          </div>
          <p className="text-sm font-semibold text-center"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            Start your housing search
          </p>
          <Link href="/signup"
            className="flex items-center justify-center w-full font-bold py-4 rounded-2xl gap-2 text-sm"
            style={{ backgroundColor: "var(--color-action)", color: "#fff", fontFamily: "var(--font-heading)" }}>
            Create free account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/signin"
            className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl text-sm"
            style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
            I already have an account
          </Link>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                stroke="var(--color-text-muted)" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
            </svg>
            <Link href="/properties" className="text-sm"
              style={{ color: "var(--color-text-muted)" }}>
              Browse listings without signing up
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP LAYOUT
      ══════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen flex-col">

        {/* Desktop nav */}
        <nav className="flex items-center justify-between px-16 py-6"
          style={{ borderBottom: "1px solid rgba(67,160,71,0.1)" }}>
          <LogoMark />
          <div className="flex items-center gap-3">
            <Link href="/properties" className="text-sm font-medium px-4 py-2 rounded-xl"
              style={{ color: "#A5C8A5" }}>
              Browse listings
            </Link>
            <Link href="/signin"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{ border: "1px solid rgba(67,160,71,0.5)", color: "var(--color-action)" }}>
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm font-bold px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "var(--color-action)", color: "#fff", fontFamily: "var(--font-heading)" }}>
              Get started free
            </Link>
          </div>
        </nav>

        {/* Desktop hero */}
        <div className="flex flex-1">

          {/* Left */}
          <div className="flex-1 flex flex-col justify-center px-16 py-16">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(67,160,71,0.12)",
                  border: "1px solid rgba(67,160,71,0.3)",
                  color: "var(--color-action)",
                }}>
                <span className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-action)" }} />
                Now live in Akwa Ibom · More states coming soon
              </span>
            </div>
            <h1 className="font-black leading-none mb-6"
              style={{
                fontSize: "clamp(48px, 5vw, 72px)",
                color: "#E8F5E9",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-2px",
              }}>
              Housing for<br />
              <span style={{ color: "var(--color-action)", fontStyle: "italic" }}>corpers.</span><br />
              Done right.
            </h1>
            <p className="text-base leading-relaxed mb-10"
              style={{ color: "#A5C8A5", maxWidth: "420px" }}>
              CorperNest verifies every listing before it goes live.
              Pay a small inspection fee, meet the agent, and move in
              with full confidence. No scams, no surprises.
            </p>
            <div className="flex items-center gap-3 mb-12">
              <Link href="/signup"
                className="flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-sm"
                style={{ backgroundColor: "var(--color-action)", color: "#fff", fontFamily: "var(--font-heading)" }}>
                Create free account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/properties"
                className="flex items-center gap-2 font-semibold px-8 py-4 rounded-2xl text-sm"
                style={{ border: "1.5px solid rgba(67,160,71,0.4)", color: "#A5C8A5" }}>
                Browse listings
              </Link>
            </div>
            <div className="flex items-center gap-8">
              {[
                { value: "100%", label: "Verified listings" },
                { value: "₦5,000", label: "Flat inspection fee" },
                { value: "0", label: "Scam reports" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-8">
                  {i > 0 && (
                    <div className="w-px h-8"
                      style={{ backgroundColor: "rgba(67,160,71,0.2)" }} />
                  )}
                  <div>
                    <p className="text-2xl font-black"
                      style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#7A9A7A" }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — action panel */}
          <div className="w-full max-w-sm flex flex-col justify-center px-10 py-16 m-8 rounded-3xl"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <p className="text-xl font-black mb-1"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              Find your home
            </p>
            <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
              Join corpers who found verified housing through CorperNest.
            </p>
            <div className="space-y-3 mb-8">
              <Link href="/signup"
                className="flex items-center justify-center w-full font-bold py-4 rounded-2xl gap-2 text-sm"
                style={{ backgroundColor: "var(--color-action)", color: "#fff", fontFamily: "var(--font-heading)" }}>
                Create free account →
              </Link>
              <Link href="/signin"
                className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl text-sm"
                style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                I have an account
              </Link>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                    stroke="var(--color-text-muted)" strokeWidth="1.8" />
                  <circle cx="12" cy="10" r="3" stroke="var(--color-text-muted)" strokeWidth="1.8" />
                </svg>
                <Link href="/properties" className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}>
                  Browse without signing up
                </Link>
              </div>
            </div>
            <div className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
                How it works
              </p>
              {[
                { step: "01", text: "Browse verified listings" },
                { step: "02", text: "Pay ₦5,000 inspection fee" },
                { step: "03", text: "Visit, confirm, move in" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="text-xs font-black w-6 shrink-0"
                    style={{ color: "var(--color-action)", fontFamily: "var(--font-mono)" }}>
                    {item.step}
                  </span>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}