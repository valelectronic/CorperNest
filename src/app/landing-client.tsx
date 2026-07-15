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
        <Link href="/signin" style={{
          padding: "9px 20px", borderRadius: 50, fontSize: 14, fontWeight: 600,
          color: "#1B5E20", textDecoration: "none",
          border: "1.5px solid #1B5E20", display: "inline-block",
        }}>
          Sign in
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "40px 20px 36px", maxWidth: 540, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E8F5E9", borderRadius: 50, padding: "7px 16px", marginBottom: 24,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#43A047" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32" }}>
            Now live in Eket, Akwa Ibom
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(36px, 9vw, 52px)",
          fontWeight: 900, color: "#0D1F0D", margin: "0 0 16px",
          lineHeight: 1.05, letterSpacing: "-0.02em",
        }}>
          Find a property.{" "}
          <span style={{ color: "#43A047", fontStyle: "italic" }}>No scams.</span>
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: 16, color: "#444", lineHeight: 1.75, margin: "0 0 32px", maxWidth: 420 }}>
          Inspection is free. Meet a verified agent in Eket, tour all their available properties in one visit. Pay the agent directly when you arrive — nothing to us before you see the property.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          <Link href="/home" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "17px 24px", borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: "#1B5E20", color: "#fff", textDecoration: "none",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="white" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="1.8" />
            </svg>
            Browse listings — free inspection
          </Link>
          <Link href="/signup" style={{
            display: "block", padding: "16px 24px", borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: "#E8F5E9", color: "#1B5E20", textDecoration: "none", textAlign: "center",
          }}>
            Create free account →
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid #E8F0E8", borderBottom: "1px solid #E8F0E8",
          padding: "20px 0",
        }}>
          {[
            { val: "100%",  label: "Verified listings" },
            { val: "Free",  label: "To book & inspect"  },
            { val: "0",     label: "Scam reports"       },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center",
              borderRight: i < 2 ? "1px solid #E8F0E8" : "none",
              padding: "4px 0",
            }}>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22, color: "#1B5E20", margin: 0, lineHeight: 1 }}>
                {s.val}
              </p>
              <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0", lineHeight: 1.4 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "40px 20px", maxWidth: 540, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
          How it works
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              num: "01",
              title: "Browse verified listings",
              body: "Every property on CorperNest is reviewed by our team before it goes live. No fake listings, no photos that don't match.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#2E7D32" strokeWidth="1.8" />
                  <path d="M21 21l-4.35-4.35" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              num: "02",
              title: "Book a free inspection",
              body: "No payment to us. Request to inspect — we call you personally to confirm, then connect you directly to the agent.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#2E7D32" strokeWidth="1.8" fill="none" />
                </svg>
              ),
            },
            {
              num: "03",
              title: "Meet the agent, see the properties",
              body: "One visit covers everything the agent has. Pay their inspection fee when you arrive — cash or transfer, directly to them.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#2E7D32" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              num: "04",
              title: "Confirm your visit",
              body: "After meeting the agent, tap 'I Have Seen The Agent' in your bookings. This creates an official record of your inspection that protects you.",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="#2E7D32" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
          ].map((step) => (
            <div key={step.num} style={{
              background: "#fff", border: "1px solid #E8F0E8",
              borderRadius: 16, padding: "18px 16px",
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#E8F5E9",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {step.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#43A047", margin: "0 0 4px", letterSpacing: "0.04em" }}>
                  {step.num}
                </p>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "#0D1F0D", margin: "0 0 5px" }}>
                  {step.title}
                </p>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY NOT FACEBOOK/WHATSAPP ── */}
      <section style={{ padding: "40px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
            Why not just use WhatsApp?
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "#0D1F0D", margin: "0 0 12px", lineHeight: 1.25 }}>
            We're not competing with Facebook.<br />
            <span style={{ color: "#43A047", fontStyle: "italic" }}>We're fixing what Facebook created.</span>
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, margin: "0 0 24px" }}>
            WhatsApp groups and Facebook pages made it easier for anyone to post a property listing — including people who don't own or manage the property at all. The scam is simple: post attractive photos, collect inspection fees, disappear. CorperNest exists because that pattern is too common in Eket.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                label: "Verified identity on both sides",
                body: "When you book through CorperNest, the agent's real name, phone, and ID are on file with us. 'Agent Bassey' on WhatsApp is an account that could disappear tomorrow. Our agents cannot.",
              },
              {
                label: "Search by what actually matters",
                body: "Looking for a self-contained near NYSC secretariat in Eket under ₦200,000? You can filter for that here. On Facebook you scroll through hundreds of irrelevant posts hoping to find it.",
              },
              {
                label: "A record that exists",
                body: "Your CorperNest booking is documented. What was shown, when, and by whom. On WhatsApp there's a deleted message. That difference matters the moment something goes wrong.",
              },
              {
                label: "Listings that stay searchable",
                body: "A Facebook post is buried within 48 hours. A CorperNest listing stays visible to everyone searching in Eket until the property is no longer available.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#F7FBF7", border: "1px solid #E0EEE0",
                borderRadius: 14, padding: "16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#43A047", flexShrink: 0, marginTop: 6 }} />
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "#0D1F0D", margin: "0 0 5px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.7 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section style={{ padding: "40px 20px", background: "#F7FBF7", margin: "0" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
            Are you an agent?
          </p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "#0D1F0D", margin: "0 0 12px", lineHeight: 1.25 }}>
            Get verified, start receiving clients.
          </h2>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, margin: "0 0 20px" }}>
            Every client we send you has been spoken to by our team before we connect you. No time-wasters, no ghost clients. You pay ₦1,000 commission only after a client confirms they met you.
          </p>
          <Link href="/signup?agent=1" style={{
            display: "inline-block", padding: "13px 22px", borderRadius: 12,
            fontSize: 14, fontWeight: 700, background: "#1B5E20", color: "#fff", textDecoration: "none",
          }}>
            Apply as a verified agent
          </Link>
        </div>
      </section>

      {/* ── FAQS ── */}
      <section style={{ padding: "40px 20px", maxWidth: 540, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#43A047", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
          Common questions
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            {
              q: "Is the inspection really free?",
              a: "Yes. You pay nothing to CorperNest to book an inspection. When you meet the agent, you pay them their inspection fee directly — cash or transfer. That money goes to them, not us.",
            },
            {
              q: "What if I don't like any of the properties?",
              a: "You're under no obligation to rent. The inspection fee you pay the agent covers their time to show you around. If nothing works for you, you can request a different agent and try again.",
            },
            {
              q: "How do I know the agent is real?",
              a: "Every agent on CorperNest goes through our identity verification before they can list anything. We have their real name and phone on file. If anything goes wrong, we can follow up directly.",
            },
            {
              q: "Is my money safe?",
              a: "You never send money to us or to an agent through the app. The agent collects their inspection fee from you in person. CorperNest handles zero client payments — everything is face to face.",
            },
            {
              q: "What is the 'I Have Seen The Agent' button?",
              a: "After your visit, tap this in your bookings. It creates an official CorperNest record that you inspected with a verified agent — your proof if any dispute ever comes up later.",
            },
          ].map((faq, i, arr) => (
            <div key={i} style={{ borderBottom: i < arr.length - 1 ? "1px solid #E8F0E8" : "none", padding: "18px 0" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "#0D1F0D", margin: "0 0 8px" }}>
                {faq.q}
              </p>
              <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.75 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "40px 20px 48px", maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
        <Link href="/home" style={{
          display: "block", padding: "18px 24px", borderRadius: 14,
          fontSize: 16, fontWeight: 700, background: "#1B5E20", color: "#fff",
          textDecoration: "none", marginBottom: 14,
        }}>
          Browse listings now →
        </Link>
        <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "#1B5E20", fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #E8F0E8", padding: "24px 20px", textAlign: "center" }}>
        <Link href="/about" style={{ fontSize: 14, fontWeight: 600, color: "#888", textDecoration: "none", display: "block", marginBottom: 8 }}>
          About CorperNest
        </Link>
        <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>
          © {new Date().getFullYear()} Bridgenest Limited · RC 9630078
        </p>
      </footer>

    </div>
  );
}