// src/app/(main)/parkout/ambassador/certificate/certificate-client.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

type Props = {
  name:         string;
  ambassadorId: string;
  lga:          string;
  state:        string;
  totalDeals:   number;
  approvedAt:   string;
};

function CertificateContent({ name, shortId, lga, state, totalDeals, approvedAt, width }: {
  name: string; shortId: string; lga: string; state: string;
  totalDeals: number; approvedAt: string; width: number;
}) {
  const s = width / 520;

  return (
    <div style={{ width, backgroundColor: "#FDFCF7", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0F5132 0%, #15803D 50%, #0F5132 100%)", padding: `${28*s}px ${36*s}px ${22*s}px`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06 }}
          dangerouslySetInnerHTML={{ __html: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><pattern id="pd" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white"/></pattern><rect width="100%" height="100%" fill="url(#pd)"/></svg>` }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12*s }}>
            <div style={{ width: 48*s, height: 48*s, borderRadius: 10*s, backgroundColor: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 24*s }}>🏠</span>
            </div>
            <div>
              <p style={{ fontSize: 20*s, fontWeight: 700, color: "#FFFFFF", margin: 0, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.02em" }}>CorperNest</p>
              <p style={{ fontSize: 9*s, color: "rgba(255,255,255,0.65)", margin: 0, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter', Arial, sans-serif" }}>Park-Out & Earn Programme</p>
            </div>
          </div>
          <div style={{ width: 64*s, height: 64*s, borderRadius: "50%", border: "2px solid #C9A84C", backgroundColor: "rgba(201,168,76,0.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 56*s, height: 56*s, borderRadius: "50%", border: "1px dashed #C9A84C80", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 18*s, margin: 0, color: "#C9A84C", lineHeight: 1, fontFamily: "Arial, sans-serif" }}>★</p>
              <p style={{ fontSize: 7*s, color: "#C9A84C", margin: `${2*s}px 0 0`, letterSpacing: "0.08em", fontWeight: 700, fontFamily: "'Inter', Arial, sans-serif" }}>OFFICIAL</p>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: 18*s, paddingTop: 16*s, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <p style={{ fontSize: 9*s, color: "rgba(255,255,255,0.55)", margin: `0 0 ${4*s}px`, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", fontFamily: "'Inter', Arial, sans-serif" }}>Certificate of Authorization</p>
          <p style={{ fontSize: 9*s, color: "rgba(255,255,255,0.4)", margin: 0, textAlign: "center", letterSpacing: "0.08em", fontFamily: "'Inter', Arial, sans-serif" }}>
            This is to certify that the following individual has been verified and authorized
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: `${28*s}px ${36*s}px ${24*s}px`, backgroundColor: "#FDFCF7", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", opacity: 0.03, overflow: "hidden" }}>
          <p style={{ fontSize: 80*s, fontWeight: 900, color: "#15803D", transform: "rotate(-30deg)", whiteSpace: "nowrap", fontFamily: "'Playfair Display', Georgia, serif" }}>CorperNest</p>
        </div>

        {/* Name */}
        <div style={{ textAlign: "center", marginBottom: 20*s, position: "relative" }}>
          <p style={{ fontSize: 10*s, color: "#9CA3AF", margin: `0 0 ${6*s}px`, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', Arial, sans-serif" }}>Presented to</p>
          <p style={{ fontSize: 32*s, fontWeight: 700, color: "#1A1A1A", margin: `0 0 ${8*s}px`, lineHeight: 1.15, fontFamily: "'Playfair Display', Georgia, serif" }}>{name}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8*s }}>
            <div style={{ height: 1, width: 40*s, backgroundColor: "#C9A84C" }} />
            <p style={{ fontSize: 10*s, color: "#C9A84C", fontWeight: 700, margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter', Arial, sans-serif" }}>Certified Location Ambassador</p>
            <div style={{ height: 1, width: 40*s, backgroundColor: "#C9A84C" }} />
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12*s, color: "#4B5563", margin: `0 0 ${20*s}px`, lineHeight: 1.8, textAlign: "center", fontFamily: "'Inter', Arial, sans-serif" }}>
          is duly verified and authorized as an official{" "}
          <strong style={{ color: "#1A1A1A" }}>Location Ambassador</strong> for the{" "}
          <strong style={{ color: "#15803D" }}>CorperNest Park-Out & Earn Programme</strong>,
          empowered to verify listings and facilitate room handovers for incoming tenants in{" "}
          <strong style={{ color: "#15803D" }}>{lga}, {state} State</strong>.
        </p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10*s, marginBottom: 24*s }}>
          {[
            { label: "Territory",   value: lga },
            { label: "Deals Done",  value: String(totalDeals) },
            { label: "Year Issued", value: approvedAt.split(" ").pop() ?? "2026" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center", padding: `${12*s}px ${8*s}px`, backgroundColor: "#F9F7F2", border: "1px solid #E8E0CC", borderRadius: 6*s }}>
              <p style={{ fontSize: 15*s, fontWeight: 700, color: "#15803D", margin: `0 0 ${2*s}px`, fontFamily: "'Playfair Display', Georgia, serif" }}>{stat.value}</p>
              <p style={{ fontSize: 9*s, color: "#6B7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Inter', Arial, sans-serif" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16*s, borderTop: "1px solid #E8E0CC" }}>
          <div>
            <p style={{ fontSize: 8*s, color: "#9CA3AF", margin: `0 0 ${3*s}px`, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter', Arial, sans-serif" }}>Ambassador ID</p>
            <p style={{ fontSize: 13*s, fontWeight: 700, color: "#374151", margin: `0 0 ${6*s}px`, fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}>CN-AMB-{shortId}</p>
            <p style={{ fontSize: 9*s, color: "#9CA3AF", margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>Issued: {approvedAt}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 70*s, height: 70*s, borderRadius: "50%", border: `2.5px solid #15803D`, backgroundColor: "#F0FDF4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", margin: "0 auto" }}>
              <div style={{ position: "absolute", inset: 5*s, borderRadius: "50%", border: "1px dashed #86EFAC" }} />
              <svg width={22*s} height={22*s} viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 7*s, color: "#15803D", fontWeight: 800, margin: `${1*s}px 0 0`, letterSpacing: "0.1em", fontFamily: "'Inter', Arial, sans-serif" }}>VERIFIED</p>
            </div>
            <p style={{ fontSize: 8*s, color: "#9CA3AF", margin: `${6*s}px 0 0`, fontFamily: "'Inter', Arial, sans-serif" }}>Authorized Seal</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "linear-gradient(135deg, #0F5132 0%, #15803D 50%, #0F5132 100%)", padding: `${12*s}px ${36*s}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 9*s, color: "rgba(255,255,255,0.8)", margin: `0 0 ${2*s}px`, fontFamily: "'Inter', Arial, sans-serif", letterSpacing: "0.06em" }}>corpernest.com.ng</p>
          <p style={{ fontSize: 8*s, color: "rgba(255,255,255,0.45)", margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>A product of Bridgenest Limited (RC 9630078)</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3].map(i => <div key={i} style={{ width: 3*s, height: 3*s, borderRadius: "50%", backgroundColor: "#C9A84C" }} />)}
        </div>
        <p style={{ fontSize: 9*s, color: "rgba(255,255,255,0.6)", margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>Park-Out & Earn Programme</p>
      </div>
    </div>
  );
}

export default function CertificateClient({ name, ambassadorId, lga, state, totalDeals, approvedAt }: Props) {
  const captureRef    = useRef<HTMLDivElement>(null);
  const [loading,     setLoading]    = useState(false);
  const [downloaded,  setDownloaded] = useState(false);
  const [fontsReady,  setFontsReady] = useState(false);

    const shortId      = ambassadorId.replace("amb_", "").slice(0, 8).toUpperCase();
  const certProps    = { name, shortId, lga, state, totalDeals, approvedAt };
  const [previewWidth, setPreviewWidth] = useState(400);

  useEffect(() => {
    setPreviewWidth(Math.min(568, window.innerWidth - 32));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    (async () => {
      try {
        const [pf, it] = await Promise.allSettled([
          new FontFace("Playfair Display", "url(https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtXB.woff2)", { weight: "700" }).load(),
          new FontFace("Inter", "url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2)", { weight: "400 700" }).load(),
        ]);
        if (pf.status === "fulfilled") document.fonts.add(pf.value);
        if (it.status === "fulfilled") document.fonts.add(it.value);
      } catch { /* system fonts fallback */ }
      await document.fonts.ready;
      setFontsReady(true);
    })();
  }, []);

  async function handleDownload() {
    if (!captureRef.current) return;
    setLoading(true);
    try {
      await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;

      // Capture the off-screen 960px div
      // Key: position: fixed + left: -9999px + top: 0 (NOT top: -9999px)
      // Browser paints elements at top:0 even when far left
      // visibility is NOT hidden so html2canvas can read it
      const canvas = await html2canvas(captureRef.current, {
        scale:           2,        // 2 × 960px = 1920px wide
        useCORS:         true,
        backgroundColor: "#FDFCF7",
        logging:         false,
        width:           960,
        windowWidth:     960,
      });

      // Flatten onto solid background — fixes WhatsApp empty image
      const flat    = document.createElement("canvas");
      flat.width    = canvas.width;
      flat.height   = canvas.height;
      const ctx     = flat.getContext("2d")!;
      ctx.fillStyle = "#FDFCF7";
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(canvas, 0, 0);

      const link    = document.createElement("a");
      link.download = `CorperNest-Ambassador-${shortId}.jpg`;
      link.href     = flat.toDataURL("image/jpeg", 0.97);
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh", paddingBottom: 40 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top nav */}
      <div style={{ padding: "16px 16px 14px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/parkout/ambassador" style={{ display: "flex", alignItems: "center", color: "var(--color-text-muted)", textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ambassador Portal</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Your Certificate</h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 0" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20, textAlign: "center" }}>
          Download and share on WhatsApp, Instagram or Facebook
        </p>

        {/* Visible preview — scales to screen */}
        <div style={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 8px 48px rgba(0,0,0,0.18)" }}>
          <CertificateContent {...certProps} width={previewWidth} />
        </div>

        {/* Capture target — off screen LEFT only, top: 0, NOT hidden */}
        {/* html2canvas cannot paint visibility:hidden or top:-9999px elements */}
        <div
          ref={captureRef}
          aria-hidden="true"
          style={{
            position:      "fixed",
            left:          "-9999px",
            top:           0,           // ← must be 0, not -9999px
            zIndex:        -1,
            pointerEvents: "none",
            // NO visibility:hidden — browser must paint this for html2canvas
          }}
        >
          <CertificateContent {...certProps} width={960} />
        </div>

        {/* Download */}
        <button onClick={handleDownload} disabled={loading || !fontsReady}
          style={{ width: "100%", marginTop: 20, padding: "15px", borderRadius: 14, border: "none", backgroundColor: loading || !fontsReady ? "var(--color-border)" : downloaded ? "#15803D" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading || !fontsReady ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
          {!fontsReady ? "Loading fonts…"
            : loading ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Generating…</>
            : downloaded ? "✓ Downloaded! Open gallery to share"
            : "⬇ Download Certificate"}
        </button>

        <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: "12px 0 0", lineHeight: 1.6 }}>
          Save to your gallery then share on WhatsApp status or Instagram stories
        </p>
      </div>
    </div>
  );
}