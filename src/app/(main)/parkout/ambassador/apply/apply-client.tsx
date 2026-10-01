// src/app/(main)/parkout/ambassador/apply/apply-client.tsx
// Ambassador application — entry point client.
//
// STATE 1 (formUnlocked = false):
//   Shows role overview, territories and vetting fee.
//   User pays ₦2,000 → Paystack → webhook fires → status: fee_paid.
//
// STATE 2 (formUnlocked = true):
//   Imports and renders <ApplicationForm /> from ./application-form.tsx
//   ApplicationForm handles all fields, terms and submission.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ApplicationForm from "./application-form";

type ExistingApplication = {
  id: string;
  status: string;
  vetFeePaidAt: Date | string | null;
  vetFeeRef: string | null;
} | null;

type Props = {
  userName: string | null;
  userEmail: string;
  existingApplication: ExistingApplication;
};

const TERRITORIES = [
  "Eket",
  "Uyo",
  "Ikot Ekpene",
  "Enugu",
  "Aba",
  "Owerri",
  "Oron",
  "Calabar",
  "Port Harcourt",
  "Other",
];

function Spinner({ color = "#fff" }: { color?: string }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: `2px solid ${color}30`,
        borderTopColor: color,
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

// ── Already applied screen ─────────────────────────────────────────────────

function AlreadyApplied({ status }: { status: string }) {
  const router = useRouter();

  const config =
    {
      pending_review: {
        icon: "🔍",
        title: "Application Under Review",
        body: "We have received your application. Our team will contact you on WhatsApp within 48 hours.",
        color: "#4338CA",
      },
      approved: {
        icon: "✅",
        title: "Application Approved",
        body: "Your application has been approved. You are now an active CorperNest Ambassador.",
        color: "#15803D",
      },
      rejected: {
        icon: "❌",
        title: "Application Declined",
        body: "Your application was not approved at this time. Contact support for more information.",
        color: "#C62828",
      },
    }[status] ?? {
      icon: "📋",
      title: "Application Submitted",
      body: "We will be in touch soon.",
      color: "var(--color-primary)",
    };

  return (
    <div
      style={{
        minHeight: "60dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>{config.icon}</div>

      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 20,
          fontWeight: 800,
          color: config.color,
          margin: "0 0 8px",
        }}
      >
        {config.title}
      </p>

      <p
        style={{
          fontSize: 14,
          color: "var(--color-text-muted)",
          margin: "0 0 24px",
          lineHeight: 1.6,
          maxWidth: 320,
        }}
      >
        {config.body}
      </p>

      <button
        onClick={() => router.push("/parkout")}
        style={{
          padding: "12px 24px",
          borderRadius: 12,
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Back to Park-Out
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AmbassadorApplyClient({
  userName,
  userEmail,
  existingApplication,
}: Props) {
  const router = useRouter();

  const feePaid =
    existingApplication?.status === "fee_paid" ||
    !!existingApplication?.vetFeePaidAt;

  const [paying, setPaying] = useState(false);
  const [formUnlocked, setFormUnlocked] = useState(feePaid);
  const [applicationId, setApplicationId] = useState(
    existingApplication?.id ?? null
  );

  // ── Already submitted ────────────────────────────────────────────────────

  if (
    existingApplication &&
    ["pending_review", "approved", "rejected"].includes(
      existingApplication.status
    )
  ) {
    return <AlreadyApplied status={existingApplication.status} />;
  }

  // ── Payment ──────────────────────────────────────────────────────────────

  async function handlePayVettingFee() {
    setPaying(true);

    try {
      const res = await fetch(
        "/api/parkout/ambassador/apply/init-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error ?? "Could not initiate payment. Try again."
        );
        return;
      }

      setApplicationId(data.applicationId);

      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setPaying(false);
    }
  }

  // ── STATE 2: Form unlocked ──────────────────────────────────────────────

  if (formUnlocked && applicationId) {
    return (
      <ApplicationForm
        applicationId={applicationId}
        userName={userName}
      />
    );
  }

  // ── STATE 1: Before payment ─────────────────────────────────────────────

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        paddingBottom: 48,
      }}
    >
      {/* ── Hero ── */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%)",
          padding: "32px 20px 28px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.65)",
            margin: "0 0 6px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Park-Out & Earn
        </p>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 24,
            fontWeight: 900,
            color: "#fff",
            margin: "0 0 10px",
            lineHeight: 1.2,
          }}
        >
          Become a Location Ambassador
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          Help CorperNest verify Park-Out listings, support property
          inspections and assist with confirmed handovers in your territory.
        </p>
      </div>

      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "16px 16px",
        }}
      >
        {/* ── Role overview ── */}

        <div
          style={{
            borderRadius: 16,
            padding: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 14px",
            }}
          >
            What you do
          </p>

          {[
            {
              icon: "📞",
              title: "Verify listings",
              body: "Contact the outgoing tenant and confirm the property details and landlord consent.",
            },
            {
              icon: "🚶",
              title: "Support inspections",
              body: "Meet incoming tenants and assist with property inspections when assigned.",
            },
            {
              icon: "🤝",
              title: "Confirm handovers",
              body: "Be present when a confirmed handover takes place and report the outcome to CorperNest.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "var(--color-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    margin: "0 0 2px",
                  }}
                >
                  {item.title}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── How the process works ── */}

        <div
          style={{
            borderRadius: 16,
            padding: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 14px",
            }}
          >
            How it works
          </p>

          {[
            {
              number: "1",
              title: "Pay the vetting fee",
              body: "Pay the one-time ₦2,000 non-refundable vetting and onboarding fee.",
            },
            {
              number: "2",
              title: "Complete your application",
              body: "Provide your details, identification and territory information.",
            },
            {
              number: "3",
              title: "Complete vetting",
              body: "Our team reviews your application and may contact you for verification.",
            },
            {
              number: "4",
              title: "Start when approved",
              body: "Approved Ambassadors can receive Park-Out assignments in their territory.",
            },
          ].map((item, index, items) => (
            <div
              key={item.number}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: index < items.length - 1 ? 14 : 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-light)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {item.number}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    margin: "2px 0 2px",
                  }}
                >
                  {item.title}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Open territories ── */}

        <div
          style={{
            borderRadius: 14,
            padding: "14px 16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 10px",
            }}
          >
            Open territories
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {TERRITORIES.map((territory) => (
              <span
                key={territory}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: "var(--color-light)",
                  color: "var(--color-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {territory}
              </span>
            ))}
          </div>
        </div>

        {/* ── Fee disclosure ── */}

        <div
          style={{
            borderRadius: 14,
            padding: "14px 16px",
            backgroundColor: "#FFF8E1",
            border: "1px solid #FAC775",
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#92400E",
              margin: "0 0 6px",
            }}
          >
            ⚠️ Vetting & Onboarding Fee: ₦2,000
          </p>

          <p
            style={{
              fontSize: 12,
              color: "#92400E",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            The ₦2,000 fee is non-refundable. It covers identity
            verification, territory vetting and onboarding.
          </p>

          <div style={{ marginTop: 10 }}>
            {[
              "Identity & ID verification",
              "Territory review",
              "Admin vetting and phone interview",
              "Ambassador Portal access if approved",
            ].map((item) => (
              <p
                key={item}
                style={{
                  fontSize: 11,
                  color: "#92400E",
                  margin: "2px 0",
                  paddingLeft: 12,
                }}
              >
                → {item}
              </p>
            ))}
          </div>
        </div>

        {/* ── Payment ── */}

        <button
          onClick={handlePayVettingFee}
          disabled={paying}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            backgroundColor: paying
              ? "var(--color-border)"
              : "var(--color-primary)",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 15,
            cursor: paying ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {paying ? (
            <>
              <Spinner />
              Processing…
            </>
          ) : (
            "Pay ₦2,000 & Continue to Application"
          )}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            textAlign: "center",
            margin: "0 0 8px",
          }}
        >
          Payment processed securely via Paystack
        </p>

        <button
          onClick={() => router.push("/parkout")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 14,
            border: "none",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← Back to Park-Out
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}