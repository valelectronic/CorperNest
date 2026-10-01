// src/app/(main)/parkout/ambassador/apply/success/page.tsx
// Shown after ambassador application is submitted successfully.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Submitted | CorperNest Ambassador",
};

export default function AmbassadorApplySuccessPage() {
  return (
    <div style={{ minHeight: "80dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "#15803D", margin: "0 0 10px" }}>
        Application Submitted!
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 8px", lineHeight: 1.7, maxWidth: 340 }}>
        Thank you for applying to become a CorperNest Location Ambassador.
      </p>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 32px", lineHeight: 1.7, maxWidth: 340 }}>
        Our team will review your application and contact you on your WhatsApp number within <strong>48 hours</strong>.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        <Link href="/parkout"
          style={{ padding: "14px", borderRadius: 14, backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center" }}>
          Back to Park-Out & Earn
        </Link>
        <Link href="/home"
          style={{ padding: "13px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}