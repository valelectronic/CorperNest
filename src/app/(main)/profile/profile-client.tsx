// src/app/(main)/profile/profile-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  state?: string | null;
  callUpNumber?: string | null;
  emailVerified?: boolean;
}

function InlineAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : "U";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        background: "var(--color-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "1px solid var(--color-border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: Math.round(size * 0.38),
          color: "#fff",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAgent = user.role === "agent";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/");
    } catch {
      toast.error("Could not sign out. Try again.");
      setLoggingOut(false);
    }
  }

  // Fix 4 — no API call, no role switching here, just navigate
  function handleBecomeAgent() {
    router.push("/agent/kyc");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        paddingBottom: 88,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 16px",
          background: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--color-header)",
            margin: 0,
          }}
        >
          Profile
        </h1>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Avatar + name card */}
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <InlineAvatar name={user.name} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--color-header)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: 6,
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: isAgent ? "var(--color-light)" : "#E3F2FD",
                color: isAgent ? "var(--color-primary)" : "#1565C0",
                textTransform: "capitalize",
              }}
            >
              {isAgent ? "Agent" : "User"}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 16,
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          {[
            {
              label: "Phone",
              value: user.phone ?? "Not set",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.6 10.8a15.15 15.15 0 006.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.86 21 3 13.14 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.58.11.35.03.74-.24 1.02L6.6 10.8Z"
                    fill="var(--color-text-muted)"
                  />
                </svg>
              ),
            },
            ...(user.state
              ? [{
                  label: "State",
                  value: user.state,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
                        fill="var(--color-text-muted)"
                      />
                    </svg>
                  ),
                }]
              : []),
            ...(user.callUpNumber
              ? [{
                  label: "Call-Up Number",
                  value: user.callUpNumber,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="2" width="16" height="20" rx="2"
                        stroke="var(--color-text-muted)" strokeWidth="1.8" fill="none" />
                      <path d="M8 10h8M8 14h5"
                        stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ),
                }]
              : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "var(--color-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {row.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--color-text)", fontWeight: 500 }}>
                  {row.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Become an Agent — only shown to non-agents */}
        {!isAgent && (
          <button
            onClick={handleBecomeAgent}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--color-primary)",
              border: "none",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z"
                  stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4"
                  stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                Become a Verified Agent
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                List properties and earn from inspections
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Agent dashboard link — only shown to agents */}
        {isAgent && (
          <button
            onClick={() => router.push("/agent")}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--color-light)",
              border: "1.5px solid var(--color-border)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8" fill="none" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8" fill="none" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8" fill="none" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="#fff" strokeWidth="1.8" fill="none" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
                Agent Dashboard
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                Manage listings and bookings
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "var(--color-card)",
            border: "1px solid #FFCDD2",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#FFF5F5",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#E53935" }}>
            Sign Out
          </span>
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", marginTop: 8 }}>
          CorperNest v0.1 · Akwa Ibom
        </p>
      </div>

      {/* Confirm logout bottom sheet */}
      {showConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}
        >
          <div
            onClick={() => !loggingOut && setShowConfirm(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
          />
          <div
            style={{
              position: "relative",
              background: "var(--color-card)",
              borderRadius: "20px 20px 0 0",
              padding: "20px 16px 36px",
              display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 8px" }} />
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, color: "var(--color-header)", margin: 0, textAlign: "center" }}>
              Sign out?
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: "0 0 8px", textAlign: "center", lineHeight: 1.5 }}>
              You'll need to sign back in to book inspections or save properties.
            </p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: "100%", padding: "15px",
                background: loggingOut ? "#EF9A9A" : "#E53935",
                color: "#fff", border: "none", borderRadius: 14,
                fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
                cursor: loggingOut ? "not-allowed" : "pointer",
              }}
            >
              {loggingOut ? "Signing out…" : "Yes, sign out"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loggingOut}
              style={{
                width: "100%", padding: "15px",
                background: "var(--color-light)", color: "var(--color-primary)",
                border: "none", borderRadius: 14,
                fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}