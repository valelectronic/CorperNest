"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getLGAs } from "@/lib/nigeria-location";

const PROPERTY_TYPES = [
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat"      },
  { value: "1-bed",     label: "1 Bedroom"      },
  { value: "2-bed",     label: "2 Bedroom"      },
  { value: "3-bed",     label: "3 Bedroom"      },
  { value: "room",      label: "Single Room"    },
];

const ACTIVE_LGAS   = ["Eket"];
const ACTIVE_STATES = ["Akwa Ibom"];

const ALL_NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu",
  "FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi",
  "Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

function formatWithCommas(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-NG");
}

const inputStyle = {
  width: "100%", padding: "13px 14px", borderRadius: 12,
  border: "1.5px solid var(--color-border)", fontSize: 14,
  color: "var(--color-text)", backgroundColor: "var(--color-bg)",
  boxSizing: "border-box" as const, fontFamily: "var(--font-body)",
};

const labelStyle = {
  fontSize: 13, fontWeight: 600 as const, color: "var(--color-text-secondary)",
  marginBottom: 6, display: "block" as const,
};

type Screen = "info" | "verifying" | "form" | "submitted";

export default function RequestPropertyPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [screen,     setScreen]     = useState<Screen>("info");
  const [payRef,     setPayRef]     = useState<string | null>(null);
  const [paying,     setPaying]     = useState(false);

  // Form state
  const [state,     setState]     = useState(ACTIVE_STATES[0]);
  const [lga,       setLga]       = useState(ACTIVE_LGAS[0]);
  const lgaOptions                = getLGAs(state);
  const [purpose,   setPurpose]   = useState<"rent" | "sale">("rent");
  const [type,      setType]      = useState("");
  const [landmark,  setLandmark]  = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);

  // Handle Paystack callback — verify payment on return
  useEffect(() => {
    const ref    = searchParams.get("ref");
    const status = searchParams.get("status");
    if (!ref) return;

    if (status === "cancelled") {
      toast.error("Payment cancelled. Try again when you're ready.");
      return;
    }

    setScreen("verifying");
    verifyPayment(ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPayment(ref: string) {
    try {
      const res  = await fetch(`/api/payments/verify-search?ref=${ref}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        setPayRef(ref);
        setScreen("form");
        toast.success("Payment confirmed — fill in your requirements below.");
      } else {
        toast.error(data.error ?? "Payment could not be verified. Contact support.");
        setScreen("info");
      }
    } catch {
      toast.error("Could not verify payment. Try again.");
      setScreen("info");
    }
  }

  async function handlePay() {
    setPaying(true);
    try {
      const res  = await fetch("/api/payments/search-request/initiate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not start payment"); setPaying(false); return; }
      if (!data.authorizationUrl) { toast.error("Payment link not received. Try again."); setPaying(false); return; }
      window.location.href = data.authorizationUrl;
    } catch {
      toast.error("Network error. Try again.");
      setPaying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lga)                        { toast.error("Please select your LGA.");              return; }
    if (!type)                       { toast.error("Please select a property type.");       return; }
    if (!landmark.trim())            { toast.error("Please enter the nearest landmark.");   return; }
    if (!minBudget || !maxBudget)    { toast.error("Please enter both min and max budget."); return; }
    if (!notes.trim())               { toast.error("Please fill in your requirements.");    return; }

    const min = Number(minBudget.replace(/,/g, ""));
    const max = Number(maxBudget.replace(/,/g, ""));
    if (min <= 0 || max <= 0) { toast.error("Please enter valid budget amounts."); return; }
    if (min > max)            { toast.error("Min budget can't be more than max."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/property-requests/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          lga, state, type, purpose,
          landmark: landmark.trim(),
          minBudget: min, maxBudget: max,
          notes: notes.trim(),
          paymentRef: payRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not submit. Try again."); setLoading(false); return; }
      setScreen("submitted");
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  // ── VERIFYING SCREEN ──────────────────────────────────────────────────────
  if (screen === "verifying") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-header)", margin: 0 }}>Verifying payment…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── SUBMITTED SCREEN ──────────────────────────────────────────────────────
  if (screen === "submitted") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 12px" }}>
          We're on it!
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.75, maxWidth: 300, margin: "0 0 8px" }}>
          Your request is active for 7 days. Our team will contact agents across Eket on your behalf.
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, maxWidth: 300, margin: "0 0 32px" }}>
          You'll get a notification the moment we find something that matches. If nothing is found in 7 days, you get a full refund.
        </p>
        <button onClick={() => router.push("/bookings?tab=requests")}
          style={{ padding: "14px 32px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          View My Request
        </button>
      </div>
    );
  }

  // ── INFO SCREEN ────────────────────────────────────────────────────────────
  if (screen === "info") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-bg)", paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
          <button onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", background: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
            Dedicated Property Search
          </p>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>

          {/* Hero */}
          <div style={{ background: "linear-gradient(135deg, #1B2E1B 0%, #2E4A2E 100%)", borderRadius: 20, padding: "28px 24px", marginBottom: 28, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#A5D6A7" strokeWidth="1.8" />
                <path d="M21 21l-4.35-4.35" stroke="#A5D6A7" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11 8v6M8 11h6" stroke="#A5D6A7" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>
              Get a dedicated agent<br />searching for you.
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", margin: "0 0 20px", lineHeight: 1.7 }}>
              Can't find what you need in the listings? Tell us exactly what you want and our team will hunt for it across Eket.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "8px 16px" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "var(--font-heading)" }}>₦5,000</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>· fully refunded if nothing found in 7 days</span>
            </div>
          </div>

          {/* How it works */}
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-header)", margin: "0 0 16px" }}>
            How it works
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 28 }}>
            {[
              {
                step: "1",
                title: "Pay ₦5,000 to get started",
                body: "This confirms you're serious and covers our search effort. Fully refunded if we find nothing in 7 days.",
              },
              {
                step: "2",
                title: "Tell us exactly what you need",
                body: "Type, area, budget, landmark, any specific requirements. The more detail, the better we can match.",
              },
              {
                step: "3",
                title: "We contact agents across Eket",
                body: "Our team reaches out to verified agents on your behalf — properties that aren't even listed publicly.",
              },
              {
                step: "4",
                title: "We connect you when we find a match",
                body: "You get notified immediately. The agent is expecting your call. Inspection through CorperNest as normal.",
              },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: i < arr.length - 1 ? 20 : 0, position: "relative" }}>
                {i < arr.length - 1 && (
                  <div style={{ position: "absolute", left: 19, top: 40, bottom: 0, width: 2, background: "var(--color-border)" }} />
                )}
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, color: "#fff" }}>{item.step}</span>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: "0 0 4px" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.65 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Refund note */}
          <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 14, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="#2E7D32" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 12, color: "#2E7D32", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
              <strong>Full refund guarantee.</strong> If our team cannot find a property that matches your requirements within 7 days, your ₦5,000 is returned in full — no questions asked.
            </p>
          </div>

          {/* CTA */}
          <button onClick={handlePay} disabled={paying}
            style={{ width: "100%", padding: "16px", background: paying ? "var(--color-border)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            {paying ? (
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            ) : (
              <>
                Pay ₦5,000 to Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: 0 }}>
            🔒 Secured by Paystack · Refundable within 7 days if no match found
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── FORM SCREEN (after payment verified) ──────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>
            What are you looking for?
          </p>
          <p style={{ fontSize: 11, color: "var(--color-primary)", margin: 0, fontWeight: 600 }}>
            Payment confirmed ✓ — fill this in carefully
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {/* Reminder */}
        <div style={{ background: "var(--color-light)", borderRadius: 14, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            The more specific you are, the faster we can find you a match. Be honest about your budget — we won't show you things you can't afford.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Purpose */}
          <div>
            <label style={labelStyle}>Looking to</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["rent", "sale"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPurpose(p)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, border: purpose === p ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)", backgroundColor: purpose === p ? "var(--color-light)" : "var(--color-bg)", color: purpose === p ? "var(--color-primary)" : "var(--color-text-secondary)", cursor: "pointer" }}>
                  {p === "rent" ? "Rent" : "Buy"}
                </button>
              ))}
            </div>
          </div>

          {/* State */}
          <div>
            <label style={labelStyle}>State</label>
            <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} required style={inputStyle}>
              {ALL_NIGERIAN_STATES.map((s) => (
                <option key={s} value={s} disabled={!ACTIVE_STATES.includes(s)}>
                  {ACTIVE_STATES.includes(s) ? s : `${s} (Coming soon)`}
                </option>
              ))}
            </select>
          </div>

          {/* LGA */}
          <div>
            <label style={labelStyle}>Local Government Area</label>
            <select value={lga} onChange={(e) => setLga(e.target.value)} required style={inputStyle}>
              {lgaOptions.map((l) => (
                <option key={l} value={l} disabled={!ACTIVE_LGAS.includes(l)}>
                  {ACTIVE_LGAS.includes(l) ? l : `${l} (Coming soon)`}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              Currently focused on Eket — more areas launching soon.
            </p>
          </div>

          {/* Property Type */}
          <div>
            <label style={labelStyle}>Property Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PROPERTY_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  style={{ padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600, border: type === t.value ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)", backgroundColor: type === t.value ? "var(--color-light)" : "var(--color-bg)", color: type === t.value ? "var(--color-primary)" : "var(--color-text-secondary)", cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label style={labelStyle}>Nearest landmark</label>
            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near NYSC secretariat, Behind Eket market"
              required style={inputStyle} />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              Be as specific as possible — this is how we find the right area.
            </p>
          </div>

          {/* Budget */}
          <div>
            <label style={labelStyle}>
              Budget {purpose === "rent" ? "(₦/year)" : "(₦)"}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="text" inputMode="numeric" value={minBudget}
                onChange={(e) => setMinBudget(formatWithCommas(e.target.value))}
                placeholder="Min e.g. 150,000" required style={inputStyle} />
              <input type="text" inputMode="numeric" value={maxBudget}
                onChange={(e) => setMaxBudget(formatWithCommas(e.target.value))}
                placeholder="Max e.g. 300,000" required style={inputStyle} />
            </div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              Be realistic — we match you to what you can actually afford.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Specific requirements</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              placeholder="e.g. Must have prepaid meter, ground floor only, no shared bathroom, close to school, quiet area"
              required style={{ ...inputStyle, resize: "none" as const }} />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              The more detail here, the better we can match you. Don't leave this blank.
            </p>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            ) : "Submit My Request"}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}