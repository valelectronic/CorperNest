import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | CorperNest",
  description: "CorperNest is a verified housing marketplace for Nigerians — inspect before you pay, upload your rent receipt, and never miss a renewal. Operated by Bridgenest Limited.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 60 }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "32px 20px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 8px" }}>
          About CorperNest
        </p>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Verified housing for every Nigerian — no scams, no upfront agent fees, inspect before you pay.
        </p>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── MISSION ── */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 20 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
            Our Mission
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7 }}>
            Every day, Nigerians searching for a place to live are forced to trust strangers with their money before ever seeing what they're paying for. CorperNest exists to end that. We verify every listing before it goes live, and you only pay your agency contact after inspecting the property in person — what you see is what you get.
          </p>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 20 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
            What You Can Do
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: "Browse verified listings", desc: "Every property is checked before it's published — no fakes, no duplicates." },
              { title: "Pay to inspect, not to gamble", desc: "A flat inspection fee unlocks the agent's contact and tours all their listings — pay only after you've seen it." },
              { title: "Track your rent", desc: "Upload your rent receipt and we'll remind you before your renewal date — never miss it again." },
              { title: "List as a verified agent", desc: "Apply for KYC verification, get approved, and start listing your own properties to reach genuine tenants." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 2px" }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMPANY ── */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 20 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
            Company Information
          </p>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Operated by</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Bridgenest Limited</p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Registered Address</p>
            <p style={{ fontSize: 14, color: "var(--color-text)", margin: 0, lineHeight: 1.6 }}>
              Ambassador Street, Ikot Ibiok, Eket,<br />
              Akwa Ibom State, Nigeria
            </p>
          </div>

          <div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Service Area</p>
            <p style={{ fontSize: 14, color: "var(--color-text)", margin: 0 }}>Eket, Akwa Ibom State — expanding across Nigeria</p>
          </div>
        </div>

        {/* ── CONTACT ── */}
        <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 20 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
            Contact Us
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 4px", lineHeight: 1.6 }}>
            For questions, support, or partnership inquiries, reach us through the app or via our official channels.
          </p>
        </div>

        {/* ── TRUST NOTE ── */}
        <div style={{ backgroundColor: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 20, padding: 16 }}>
          <p style={{ fontSize: 13, color: "#3B6D11", margin: 0, lineHeight: 1.6 }}>
            🔒 CorperNest never asks you to pay an agent directly outside the app. All inspection fees are processed securely through our platform.
          </p>
        </div>

        {/* ── COPYRIGHT ── */}
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: "8px 0 0" }}>
          © {new Date().getFullYear()} Bridgenest Limited. All rights reserved.
        </p>

      </div>
    </div>
  );
}