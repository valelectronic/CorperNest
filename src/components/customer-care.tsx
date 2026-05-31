"use client";

import { useState } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Replace with your WhatsApp number — no + sign, include country code
// e.g. Nigerian number 08012345678 → "2348012345678"
const WHATSAPP_NUMBER = "2349063087928";
const WHATSAPP_MESSAGE = "Hello! I need help with a CorperNest booking.";

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CustomerCare() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {/* ── INFO CARD ── */}
      {isOpen && (
        <div
          style={{
            marginRight: 72,
            width: 272,
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
            pointerEvents: "auto",
            animation: "slideIn 0.25s ease-out",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "14px 16px 12px",
              background: "var(--color-light)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {/* Headset icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="white" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: 0 }}>
                  CorperNest Support
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    backgroundColor: "#22C55E", display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }} />
                  <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>Online now</span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Card body */}
          <div style={{ padding: "14px 16px 16px" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, margin: "0 0 14px" }}>
              👋 Hi! Need help with a booking, payment, or finding a property? We're here.
            </p>

            {/* WhatsApp button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "12px",
                backgroundColor: "#25D366",
                color: "#fff",
                borderRadius: 12,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              {/* WhatsApp icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chat on WhatsApp
            </a>

            <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "10px 0 0" }}>
              ⚡ Usually replies within a few minutes
            </p>
          </div>
        </div>
      )}

      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contact CorperNest support"
        style={{
          position: "relative",
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "var(--color-primary)",
          border: "3px solid #fff",
          boxShadow: "0 4px 16px rgba(46,125,50,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          pointerEvents: "auto",
          transition: "transform 0.2s, box-shadow 0.2s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(46,125,50,0.45)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(46,125,50,0.35)";
        }}
      >
        {/* Headset icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="white" strokeWidth="1.8" />
        </svg>

        {/* Green online dot */}
        <span
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#22C55E",
            border: "2px solid #fff",
            animation: "pulse 1.5s infinite",
          }}
        />
      </button>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}