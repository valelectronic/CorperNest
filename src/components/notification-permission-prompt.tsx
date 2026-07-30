// src/components/notification-permission-prompt.tsx
// Contextual push permission prompt — shown at the RIGHT moment.
// Never shown on page load — only when user is about to do something
// that requires notifications (sell, buy, offer).
// Feels like help not spam.
"use client";

import { useState, useEffect } from "react";

type Props = {
  context:  "sell" | "buy" | "offer"; // what the user was trying to do
  onGranted: () => void;              // continue with the action
  onSkip:    () => void;              // skip and continue anyway
};

const CONTEXT_COPY = {
  sell: {
    emoji:   "🛍️",
    title:   "Know when your item sells",
    bullets: [
      "Get notified the moment a buyer wants your item",
      "Know when payment is confirmed in escrow",
      "Get alerted when your payout is ready",
    ],
    cta: "Enable — notify me when it sells",
  },
  buy: {
    emoji:   "🔔",
    title:   "Know when seller confirms",
    bullets: [
      "Get notified the moment the seller confirms availability",
      "Know when your 1-hour payment window starts",
      "Track your order without opening the app",
    ],
    cta: "Enable — notify me when confirmed",
  },
  offer: {
    emoji:   "💬",
    title:   "Know when seller responds",
    bullets: [
      "Get notified when seller accepts or counters your offer",
      "Never miss your 2-hour offer window",
      "Track negotiations without opening the app",
    ],
    cta: "Enable — notify me when seller responds",
  },
};

export default function NotificationPermissionPrompt({ context, onGranted, onSkip }: Props) {
  const [isIOS,      setIsIOS]      = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const copy = CONTEXT_COPY[context];

  useEffect(() => {
    setIsIOS(/iPhone|iPad/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  // Already granted — skip prompt entirely and proceed
  useEffect(() => {
    if (typeof Notification === "undefined") { onSkip(); return; }
    if (Notification.permission === "granted") { onGranted(); }
  }, []);

  // iOS not installed — show install guide instead of permission prompt
  if (isIOS && !isStandalone) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
        onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}>
        <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📲</div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 6px" }}>
              Install to get notifications
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
              iPhone users need to add CorperNest to their home screen to receive alerts when sellers confirm availability.
            </p>
          </div>

          {[
            { n: "1", text: "Tap the Share button at the bottom of Safari" },
            { n: "2", text: 'Scroll and tap "Add to Home Screen"' },
            { n: "3", text: 'Tap "Add" — then open CorperNest from your home screen' },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <p style={{ fontSize: 13, color: "var(--color-text)", margin: 0 }}>{text}</p>
            </div>
          ))}

          <button onClick={onSkip}
            style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Continue without notifications
          </button>
        </div>
      </div>
    );
  }

  async function handleEnable() {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        onGranted();
      } else {
        onSkip(); // denied or dismissed — continue anyway
      }
    } catch {
      onSkip();
    } finally {
      setRequesting(false);
    }
  }

  // Already denied — show instructions to re-enable
  if (Notification.permission === "denied") {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
        onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}>
        <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 6px" }}>
              Notifications are blocked
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
              To re-enable: click the lock icon in your browser address bar → Notifications → Allow.
            </p>
          </div>
          <button onClick={onSkip}
            style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Continue without notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}>
      <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 36px", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{copy.emoji}</div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 6px" }}>
            {copy.title}
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
            Enable notifications so you never miss a time-sensitive update.
          </p>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 20 }}>
          {copy.bullets.map((bullet, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < copy.bullets.length - 1 ? 10 : 0 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{bullet}</p>
            </div>
          ))}
        </div>

        <button onClick={handleEnable} disabled={requesting}
          style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: requesting ? "not-allowed" : "pointer", opacity: requesting ? 0.8 : 1, marginBottom: 10 }}>
          {requesting ? "Enabling…" : copy.cta}
        </button>

        <button onClick={onSkip}
          style={{ width: "100%", padding: "11px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
          Skip for now — I understand I may miss updates
        </button>
      </div>
    </div>
  );
}