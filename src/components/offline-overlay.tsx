"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── OFFLINE OVERLAY ──────────────────────────────────────────────────────────
// Full-screen blocking overlay shown when the device has no internet connection.
// Uses both the browser's online/offline events AND a real connectivity check,
// because navigator.onLine can report "online" even when connected to a wifi
// router that itself has no internet — a common situation on Nigerian networks.

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real connectivity check — not just navigator.onLine, which can lie
  const verifyConnection = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const startChecking = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      setChecking(true);
      const online = await verifyConnection();
      setChecking(false);
      if (online) {
        setIsOffline(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    }, 5000);
  }, [verifyConnection]);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    startChecking();
  }, [startChecking]);

  const handleOnline = useCallback(async () => {
    // Don't trust the browser event alone — verify before clearing the overlay
    setChecking(true);
    const online = await verifyConnection();
    setChecking(false);
    if (online) {
      setIsOffline(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    } else {
      setIsOffline(true);
      startChecking();
    }
  }, [verifyConnection, startChecking]);

  async function handleManualRetry() {
    setChecking(true);
    const online = await verifyConnection();
    setChecking(false);
    if (online) {
      setIsOffline(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
  }

  useEffect(() => {
    // Initial check on mount
    if (!navigator.onLine) {
      setIsOffline(true);
      startChecking();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleOffline, handleOnline, startChecking]);

  if (!isOffline) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "var(--color-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        backgroundColor: "#FCEBEB",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.36 9.36 8.64 9.36 5 13z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M9 17l2 2c.55-.55 1.45-.55 2 0l2-2c-1.66-1.66-4.34-1.66-6 0z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 2l20 20" stroke="#E53935" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 8px" }}>
        No internet connection
      </p>
      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 24px", maxWidth: 320, lineHeight: 1.6 }}>
        CorperNest needs an internet connection. Check your data or wifi and we'll reconnect automatically.
      </p>

      <button
        onClick={handleManualRetry}
        disabled={checking}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "13px 28px", borderRadius: 14, border: "none",
          backgroundColor: checking ? "var(--color-border)" : "var(--color-primary)",
          color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14,
          cursor: checking ? "not-allowed" : "pointer",
        }}
      >
        {checking ? (
          <>
            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            Checking…
          </>
        ) : (
          "Try again"
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}