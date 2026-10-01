// src/app/terms/page.tsx
// Terms of Service — Nigerian consumer, data protection, payments and Park-Out terms.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | CorperNest",
  description:
    "Terms of Service for CorperNest, operated by Bridgenest Limited (RC 9630078).",
};

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100dvh", padding: "48px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to CorperNest
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, color: "var(--color-header)", margin: "16px 0 4px" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Last updated: 25 September 2026
          </p>
        </div>

        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.8, marginBottom: 32 }}>
          Welcome to CorperNest. By accessing or using corpernest.com.ng, you agree to these Terms of Service. These Terms explain how CorperNest operates its housing, Park-Out &amp; Earn, and marketplace services, including applicable payment, refund, user and dispute rules.
        </p>

        {/* ── 1. OPERATOR ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            1. Platform Operator
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            CorperNest is owned and operated by <strong>BRIDGENEST LIMITED</strong> (RC 9630078), a company registered in Nigeria. Where CorperNest collects a payment through the platform, BRIDGENEST LIMITED is responsible for that platform transaction. Some housing and Park-Out &amp; Earn arrangements are made directly between the relevant parties outside CorperNest and are not payments collected or held by CorperNest.
          </p>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 2. PAYMENTS ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            2. Payments &amp; Platform Charges
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Payments collected through CorperNest are processed by BRIDGENEST LIMITED through its payment service provider.</li>
            <li>Paystack is used for applicable online payments. Paystack Payment Limited is listed by the Central Bank of Nigeria under the switching and processing licence category.</li>
            <li>Before payment, users will be shown the applicable amount and material payment terms.</li>
            <li>Where applicable, CorperNest may charge a platform service fee disclosed to the relevant user before the transaction is completed.</li>
            <li>CorperNest does not collect or hold housing facilitation payments made outside the platform.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 3. MARKETPLACE ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            3. Marketplace Orders, Returns &amp; Refunds
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Marketplace orders placed through CorperNest are subject to the applicable order, delivery and dispute process displayed on the platform.</li>
            <li>Sellers are responsible for the accuracy, legality, condition and fulfilment of the items they list.</li>
            <li>Buyers should inspect delivered items promptly and raise a dispute through the platform where an item is not received, is materially different from its description, defective, or otherwise qualifies under the applicable marketplace policy.</li>
            <li>Where a refund or return is required by applicable law or approved under CorperNest&apos;s marketplace policy, BRIDGENEST LIMITED will process the applicable remedy within a reasonable period.</li>
            <li>Nothing in these Terms removes or limits a consumer right that cannot lawfully be excluded under the Federal Competition and Consumer Protection Act 2018 or other applicable Nigerian law.</li>
            <li>Users must provide truthful evidence when raising disputes. Fraudulent or abusive claims may result in account restrictions and may be reported where required or permitted by law.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 4. HOUSING ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            4. Housing Services
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Housing listings are reviewed by CorperNest before publication, but a review does not constitute a guarantee of title, ownership, habitability, legality or future availability.</li>
            <li>Agents and property providers are responsible for the accuracy of their listing information and for complying with applicable Nigerian laws.</li>
            <li>Where a housing inspection fee is required, the amount and payment terms will be displayed before payment.</li>
            <li>CorperNest is a platform and does not itself become the landlord, tenant, property owner, estate agent or contracting party in a tenancy agreement unless expressly stated.</li>
            <li>Any tenancy agreement, rent payment, security deposit, agency fee or other property payment is governed by the agreement between the relevant parties and applicable law.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 5. PARK-OUT & EARN ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            5. Park-Out &amp; Earn
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Park-Out &amp; Earn allows eligible outgoing tenants or other authorised users to submit accommodation for review and publication for prospective incoming tenants.</li>
            <li>Submitting a Park-Out listing does not transfer ownership, tenancy rights or possession of the property to CorperNest.</li>
            <li>CorperNest may review, verify, approve, reject, suspend or remove a listing where required for safety, accuracy, compliance or platform integrity.</li>
            <li>The Property Facilitation Fee is 10% of the stated annual rent where applicable. The relevant payment arrangement is handled outside CorperNest and is not collected or held by CorperNest.</li>
            <li>Incoming tenants may be required to pay a ₦3,000 inspection fee through CorperNest. The applicable inspection outcome and refund rules are communicated during the booking process.</li>
            <li>CorperNest does not guarantee that an incoming tenant will proceed with a property, that an outgoing tenant will find a replacement, or that a tenancy will ultimately be completed.</li>
            <li>Any tenancy, property transfer, rent payment or other arrangement between the relevant parties remains subject to their agreement and applicable Nigerian law.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 6. USER RESPONSIBILITIES ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            6. User Responsibilities
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>Users must provide accurate, current and complete information when registering, listing property or listing marketplace items.</li>
            <li>Users must not list stolen, counterfeit, unlawfully obtained, unsafe or prohibited goods, or make fraudulent or misleading representations.</li>
            <li>Users must not impersonate another person, misuse another user&apos;s account, manipulate platform records, or attempt to defraud another user or CorperNest.</li>
            <li>Users must comply with applicable Nigerian laws and must not use CorperNest for unlawful purposes.</li>
            <li>Where a transaction is required to be completed through CorperNest, users must not deliberately bypass the applicable platform process in order to defeat a disclosed platform charge or protection mechanism.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 7. PRIVACY ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            7. Privacy &amp; Data Protection
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 12px" }}>
            BRIDGENEST LIMITED processes personal data in accordance with the Nigeria Data Protection Act 2023 and applicable guidance issued by the Nigeria Data Protection Commission (NDPC). Personal data is processed on an applicable lawful basis and for specified purposes such as account management, identity verification, transaction processing, fraud prevention, customer support, dispute handling, security and legal compliance.
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            Subject to applicable law, data subjects may have rights including access, rectification, objection, restriction, portability and erasure. Further details about processing activities, retention, data-subject rights and contact procedures are provided in the Privacy Policy. Full payment card credentials are handled by the relevant payment service provider and are not stored by CorperNest as full card data.
          </p>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 8. SUSPENSION & TERMINATION ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            8. Accounts, Suspension &amp; Termination
          </h2>
          <ul style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
            <li>CorperNest may restrict, suspend or terminate an account where there is suspected fraud, unlawful activity, material breach of these Terms, misuse of the platform, or a material safety or security concern.</li>
            <li>Where reasonably practicable, CorperNest may provide notice and an opportunity to address the issue, except where immediate action is necessary to protect users, the platform, payment systems or comply with law.</li>
            <li>Account termination does not remove obligations that arose before termination or rights that cannot lawfully be excluded.</li>
          </ul>
        </section>

        <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 28 }} />

        {/* ── 9. COMPLAINTS & CONTACT ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 10px" }}>
            9. Complaints &amp; Contact
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.8, margin: 0 }}>
            For support, complaints, privacy requests, disputes, or other enquiries, contact us at:<br /><br />
            <strong>BRIDGENEST LIMITED</strong><br />
            Email: <a href="mailto:corpernest@bridgenest.com.ng" style={{ color: "var(--color-primary)" }}>corpernest@bridgenest.com.ng</a><br />
            Website: <a href="https://www.corpernest.com.ng" style={{ color: "var(--color-primary)" }}>corpernest.com.ng</a><br />
            RC Number: 9630078<br />
            Address: Eket, Akwa Ibom State, Nigeria
          </p>
        </section>

        {/* ── REGULATORY NOTE ── */}
        <section style={{ marginBottom: 28, padding: "16px", background: "var(--color-light)", borderRadius: 12, borderLeft: "3px solid var(--color-primary)" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
            These Terms are intended to operate consistently with applicable Nigerian law, including the Federal Competition and Consumer Protection Act 2018 and the Nigeria Data Protection Act 2023. Where a mandatory statutory consumer or data-protection right applies, that right prevails over any inconsistent provision of these Terms.
          </p>
        </section>

        {/* ── FOOTER NAV ── */}
        <div style={{ paddingTop: 24, borderTop: "1px solid var(--color-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Home</Link>
          <Link href="/about" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>About</Link>
          <Link href="/marketplace" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Marketplace</Link>
          <Link href="/home" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Housing</Link>
          <Link href="/parkout" style={{ fontSize: 13, color: "var(--color-text-muted)", textDecoration: "none" }}>Park-Out</Link>
        </div>

      </div>
    </div>
  );
}
