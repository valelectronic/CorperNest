// src/app/agent/kyc/page.tsx
// Shown when agent.agentVerified === false
// They've clicked "List a property", are not yet verified

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AgentKYCPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/signin");

  const user = session.user as {
    role?: string | null;
    agentVerified?: boolean | null;
  };

  // Already verified → go to dashboard
  if (user.role === "agent" && user.agentVerified) {
    redirect("/agent");
  }

  // Not an agent → redirect to role page
  if (user.role !== "agent") {
    redirect("/auth/role");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        textAlign: "center",
      }}
    >
      {/* Illustration */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--color-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2Z"
            fill="var(--color-primary)"
            fillOpacity="0.2"
            stroke="var(--color-primary)"
            strokeWidth="1.6"
          />
          <path
            d="M2 21c0-4.4 4.5-8 10-8s10 3.6 10 8"
            stroke="var(--color-primary)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Checkmark badge */}
          <circle cx="19" cy="5" r="5" fill="var(--color-primary)" />
          <path
            d="M16.5 5l1.5 1.5 3-3"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 22,
          fontWeight: 800,
          color: "var(--color-header)",
          margin: "0 0 12px",
          lineHeight: 1.3,
        }}
      >
        Verification in progress
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
          maxWidth: 300,
          margin: "0 0 24px",
        }}
      >
        We received your request. Expect a call from us shortly to verify your identity before you can start listing.
      </p>

      {/* What to expect */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 16,
          width: "100%",
          maxWidth: 340,
          textAlign: "left",
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 12px",
          }}
        >
          What happens next
        </p>
        {[
          "Our team will call the phone number on your account",
          "We'll confirm your identity and discuss your listings",
          "You'll receive an email once you're approved",
          "Your verified badge will appear on all your listings",
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: i < 3 ? 10 : 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--color-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                {i + 1}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      <a
        href="/home"
        style={{
          display: "inline-block",
          padding: "13px 32px",
          background: "var(--color-primary)",
          color: "#fff",
          borderRadius: 14,
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        Back to Home
      </a>
    </div>
  );
}