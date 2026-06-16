"use client";

import { useState, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Platform = "android" | "ios" | null;

// ─── HOOK ────────────────────────────────────────────────────────────────────

function usePWAInstall() {
  const [platform,       setPlatform]       = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled,    setIsInstalled]    = useState(false);
  const [dismissed,      setDismissed]      = useState(false);

  useEffect(() => {
    // Already installed as PWA — don't show banner
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-banner-v2-dismissed"); // ← CHANGED
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < 7) { setDismissed(true); return; }
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIOS     = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isChrome  = /chrome/.test(ua) && !/edg/.test(ua);

    if (isIOS) {
      const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
      if (isSafari) setPlatform("ios");
    } else if (isAndroid && isChrome) {
      setPlatform("android");
    }

    // Capture Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-banner-v2-dismissed", String(Date.now())); // ← CHANGED
    setDismissed(true);
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    // @ts-ignore
    await deferredPrompt.prompt();
    // @ts-ignore
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    dismiss();
  }

  return { platform, deferredPrompt, isInstalled, dismissed, dismiss, installAndroid };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PWAInstallBanner() {
  const { platform, deferredPrompt, isInstalled, dismissed, dismiss, installAndroid } = usePWAInstall();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (isInstalled || dismissed || !platform) return null;
  if (platform === "android" && !deferredPrompt) return null;

  return (
    <>
      {/* Backdrop for iOS steps */}
      {showIOSSteps && (
        <div
          onClick={() => setShowIOSSteps(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 98 }}
        />
      )}

      {/* iOS Step-by-step sheet */}
      {platform === "ios" && showIOSSteps && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 99,
          background: "var(--color-card)", borderRadius: "22px 22px 0 0",
          padding: "0 20px 40px",
          maxWidth: 640, margin: "0 auto",
        }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 16px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <img src="/icon-192.png" alt="CorperNest"
              style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16, color: "var(--color-header)", margin: 0 }}>
                Install CorperNest
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                Add to your iPhone home screen
              </p>
            </div>
          </div>

          {[
            {
              num: "1",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v13M7 7l5-5 5 5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
              text: "Tap the Share button at the bottom of Safari",
              sub:  "It looks like a box with an arrow pointing up",
            },
            {
              num: "2",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-primary)" strokeWidth="1.8" />
                </svg>
              ),
              text: 'Scroll down and tap "Add to Home Screen"',
              sub:  "You may need to scroll down in the share menu",
            },
            {
              num: "3",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              text: 'Tap "Add" in the top right corner',
              sub:  "CorperNest will appear on your home screen",
            },
          ].map((step) => (
            <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                {step.icon}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 3px" }}>
                  Step {step.num} — {step.text}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                  {step.sub}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={() => { setShowIOSSteps(false); dismiss(); }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer", fontFamily: "var(--font-heading)" }}
          >
            Got it
          </button>
        </div>
      )}

      {/* ── BOTTOM BANNER ── */}
      {!showIOSSteps && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 97,
          background: "var(--color-card)",
          borderTop: "1px solid var(--color-border)",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          maxWidth: 640, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}>
          <img src="/icon-192.png" alt="CorperNest"
            style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", margin: 0 }}>
              Install CorperNest
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
              {platform === "ios"
                ? "Add to home screen for faster access"
                : "Install as an app — works offline too"}
            </p>
          </div>

          {platform === "android" ? (
            <button
              onClick={installAndroid}
              style={{ padding: "9px 16px", borderRadius: 10, background: "var(--color-primary)", border: "none", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              Install
            </button>
          ) : (
            <button
              onClick={() => setShowIOSSteps(true)}
              style={{ padding: "9px 16px", borderRadius: 10, background: "var(--color-primary)", border: "none", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              How to
            </button>
          )}

          <button
            onClick={dismiss}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}