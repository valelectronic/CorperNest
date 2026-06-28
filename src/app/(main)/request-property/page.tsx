"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

// Just add a name to this list whenever a new LGA goes active — nothing
// else in this file needs to change.
const ACTIVE_LGAS = ["Eket"];

const ALL_NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

// Same idea — add a state name here when it goes active.
const ACTIVE_STATES = ["Akwa Ibom"];

// Live-formats digits with thousand separators as the user types —
// e.g. typing "150000" displays as "150,000" immediately, making it much
// easier to visually verify ten/hundred/thousand placement at a glance.
function formatWithCommas(value: string): string {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-NG");
}

export default function RequestPropertyPage() {
  const router = useRouter();

  const [state, setState]       = useState(ACTIVE_STATES[0]);
  const [lga, setLga]           = useState(ACTIVE_LGAS[0]);
  const lgaOptions = getLGAs(state);

  const [purpose, setPurpose]   = useState<"rent" | "sale">("rent");
  const [type, setType]         = useState("");
  const [landmark, setLandmark] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [notes, setNotes]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lga || !type) {
      toast.error("Please select an LGA and property type.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/property-requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lga,
          state,
          type,
          purpose,
          landmark: landmark.trim() || undefined,
          minBudget: minBudget ? Number(minBudget.replace(/,/g, "")) : undefined,
          maxBudget: maxBudget ? Number(maxBudget.replace(/,/g, "")) : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not submit request. Try again.");
        setLoading(false);
        return;
      }

      toast.success("Request submitted! We'll notify you the moment we find something.");
      router.push("/bookings?tab=requests");
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

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
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
          Request a Property
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          Tell us what you're looking for. We'll hunt for it and notify you the moment we find something — no charge until you actually book an inspection.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Looking to
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["rent", "sale"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPurpose(p)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, border: purpose === p ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)", backgroundColor: purpose === p ? "var(--color-light)" : "var(--color-bg)", color: purpose === p ? "var(--color-primary)" : "var(--color-text-secondary)", cursor: "pointer" }}>
                  {p === "rent" ? "Rent" : "Buy"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              State
            </label>
            <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} required
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }}>
              {ALL_NIGERIAN_STATES.map((s) => (
                <option key={s} value={s} disabled={!ACTIVE_STATES.includes(s)}>
                  {ACTIVE_STATES.includes(s) ? s : `${s} (Coming soon)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Local Government Area
            </label>
            <select value={lga} onChange={(e) => setLga(e.target.value)} required
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }}>
              {lgaOptions.map((l) => (
                <option key={l} value={l} disabled={!ACTIVE_LGAS.includes(l)}>
                  {ACTIVE_LGAS.includes(l) ? l : `${l} (Coming soon)`}
                </option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              We're currently focused on Eket — more areas (and states) launching soon.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Property Type
            </label>
            <select value={type} onChange={(e) => setType(e.target.value)} required
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }}>
              <option value="">Select type</option>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Nearest landmark <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional — skip if you're not sure)</span>
            </label>
            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near NYSC secretariat"
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Budget {purpose === "rent" ? "range (₦/year)" : "range (₦)"} <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="text" inputMode="numeric" value={minBudget}
                onChange={(e) => setMinBudget(formatWithCommas(e.target.value))}
                placeholder="Min e.g. 150,000"
                style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }} />
              <input type="text" inputMode="numeric" value={maxBudget}
                onChange={(e) => setMaxBudget(formatWithCommas(e.target.value))}
                placeholder="Max e.g. 300,000"
                style={{ padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
              Anything else? <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="e.g. Prepaid meter preferred, ground floor only"
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", fontFamily: "var(--font-body)", resize: "none" }} />
          </div>

          <div style={{ backgroundColor: "var(--color-light)", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
              Your request stays active for 7 days. We'll notify you the moment we find a match — no payment needed until you decide to book an inspection.
            </p>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: loading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}