// src/app/terms/page.tsx
// Terms of Service — required for Paystack compliance review.
// Confirms Bridgenest Limited as merchant of record.
// Includes NDPA compliance, refund policy, and physical address.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | CorperNest",
  description: "Terms of Service for CorperNest, operated by Bridgenest Limited (RC 9630078).",
};

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100dvh", padding: "48px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to CorperNest
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, color: "var(--color-header)", margin: "16px 0 4px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Last updated: 22 August 2026
          </p>
        </div>

        {/* Intro */}
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.8, marginBottom: 32 }}>
          Welcome to CorperNest. By accessing or using our platform at corpernest.com.ng, you agree to be bound by these Terms of Service. Please read them carefully.
        </p>

        {/* Section 1 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            1. Platform Operator &amp; Merchant of Record
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            CorperNest is owned and operated by <strong>BRIDGENEST LIMITED</strong> (RC 9630078), a company registered in Nigeria. All commercial transactions, order processing, and payment collections on CorperNest are processed by BRIDGENEST LIMITED as the official merchant of record.
          </p>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 2 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            2. Orders &amp; Payments
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>All transactions completed on CorperNest are standard e-commerce order purchases processed by BRIDGENEST LIMITED.</li>
            <li>Payments are securely processed via Paystack, a Central Bank of Nigeria (CBN)-licensed payment gateway.</li>
            <li>All orders are covered by our buyer protection policy.</li>
            <li>Sellers on the platform are verified registered users who fulfill orders directly.</li>
            <li>CorperNest charges a 5% platform service fee on marketplace transactions, deducted from the seller payout.</li>
            <li>Processing fees charged by Paystack may be deducted from the total refund amount where applicable under Paystack&apos;s merchant processing terms.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 3 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            3. Order Confirmations &amp; Refunds
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Once an order is placed, buyers receive an order confirmation notification.</li>
            <li>Buyers are encouraged to mark orders as fulfilled upon receiving their item. Orders are automatically marked fulfilled 48 hours post-delivery unless a formal dispute is opened.</li>
            <li>If an item is not received or is not as described, buyers must raise a dispute within 48 hours of expected delivery.</li>
            <li>Refund eligibility is determined by BRIDGENEST LIMITED after reviewing the dispute. Approved refunds are processed within 3–5 business days to the buyer&apos;s original payment method. Payment processing fees charged by the payment processor may be non-refundable.</li>
            <li>CorperNest reserves the right to suspend accounts involved in fraudulent transactions.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 4 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            4. Housing &amp; Property Listings
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>All property listings on CorperNest are reviewed by our team before going live.</li>
            <li>Agents must complete identity verification before listing properties.</li>
            <li>Property inspection bookings are free. Buyers pay agents directly after physical inspection.</li>
            <li>CorperNest charges agents a platform service fee after a confirmed visit or transaction.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 5 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            5. User Responsibilities
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Users must provide accurate information when registering and listing items.</li>
            <li>Listing stolen, counterfeit, or fraudulently obtained items is strictly prohibited and will be reported to law enforcement agencies including the Nigeria Police Force and the EFCC.</li>
            <li>Users may not use the platform to conduct off-platform transactions to circumvent checkout protections.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 6 — NDPA */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            6. Privacy &amp; Data Protection
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            Your personal data is handled in compliance with the Nigeria Data Protection Act (NDPA). BRIDGENEST LIMITED processes customer data solely for order fulfillment, account safety, and dispute resolution. Full payment card credentials are encrypted and handled directly by Paystack — CorperNest does not store payment card data on its servers.
          </p>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* Section 7 — Contact */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            7. Contact Information
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            For support, disputes, or enquiries, contact us at:<br /><br />
            <strong>BRIDGENEST LIMITED</strong><br />
            Email: <a href="mailto:corpernest@bridgenest.com.ng" style={{ color: "var(--color-primary)" }}>corpernest@bridgenest.com.ng</a><br />
            Website: <a href="https://www.corpernest.com.ng" style={{ color: "var(--color-primary)" }}>corpernest.com.ng</a><br />
            RC Number: 9630078<br />
            Address: Eket, Akwa Ibom State, Nigeria
          </p>
        </section>

        {/* Footer nav */}
        <div style={{ paddingTop: 24, borderTop: "1px solid var(--color-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Home</Link>
          <Link href="/about" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>About</Link>
          <Link href="/marketplace" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Marketplace</Link>
          <Link href="/home" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Housing</Link>
        </div>

      </div>
    </div>
  );
}