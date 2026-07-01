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
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: "1.5px solid var(--color-border)",
  fontSize: 14,
  color: "var(--color-text)",
  backgroundColor: "var(--color-bg)",
  boxSizing: "border-box" as const,
  fontFamily: "var(--font-body)",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
  display: "block" as const,
};

export default function RequestPropertyPage() {
  const router = useRouter();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // All fields are now required — nothing optional
    if (!lga)              { toast.error("Please select your LGA.");                    return; }
    if (!type)             { toast.error("Please select a property type.");             return; }
    if (!landmark.trim())  { toast.error("Please enter the nearest landmark.");         return; }
    if (!minBudget || !maxBudget) { toast.error("Please enter both min and max budget."); return; }
    if (!notes.trim())     { toast.error("Please fill in your specific requirements."); return; }

    const min = Number(minBudget.replace(/,/g, ""));
    const max = Number(maxBudget.replace(/,/g, ""));
    if (min <= 0 || max <= 0) { toast.error("Please enter valid budget amounts."); return; }
    if (min > max)            { toast.error("Minimum budget can't be more than maximum."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/property-requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lga, state, type, purpose,
          landmark: landmark.trim(),
          minBudget: min,
          maxBudget: max,
          notes: notes.trim(),
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

        {/* Intro */}
        <div style={{ background: "var(--color-primary)", borderRadius: 16, padding: "18px 18px", marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="#fff" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="3" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
              Tell us exactly what you need
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>
              Fill every field carefully — the more specific you are, the better we can match you. No payment until you decide to book.
            </p>
          </div>
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
            <select value={type} onChange={(e) => setType(e.target.value)} required style={inputStyle}>
              <option value="">Select type</option>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Landmark — was optional, now required */}
          <div>
            <label style={labelStyle}>
              Nearest landmark
              <span style={{ fontSize: 11, color: "#E53935", marginLeft: 6 }}>required</span>
            </label>
            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near NYSC secretariat, Behind Eket market"
              required style={inputStyle} />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              This helps us find something in the right area — be as specific as possible.
            </p>
          </div>

          {/* Budget — was optional, now required */}
          <div>
            <label style={labelStyle}>
              Budget {purpose === "rent" ? "range (₦/year)" : "range (₦)"}
              <span style={{ fontSize: 11, color: "#E53935", marginLeft: 6 }}>required</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="text" inputMode="numeric" value={minBudget}
                onChange={(e) => setMinBudget(formatWithCommas(e.target.value))}
                placeholder="Min e.g. 150,000"
                required style={inputStyle} />
              <input type="text" inputMode="numeric" value={maxBudget}
                onChange={(e) => setMaxBudget(formatWithCommas(e.target.value))}
                placeholder="Max e.g. 300,000"
                required style={inputStyle} />
            </div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              We use this to only match you with properties you can actually afford.
            </p>
          </div>

          {/* Notes — was optional, now required */}
          <div>
            <label style={labelStyle}>
              Specific requirements
              <span style={{ fontSize: 11, color: "#E53935", marginLeft: 6 }}>required</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="e.g. Must have prepaid meter, ground floor only, no shared bathroom, close to school"
              required
              style={{ ...inputStyle, resize: "none" as const }} />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              The more detail you give, the better we can match you — don't leave this blank.
            </p>
          </div>

          {/* Info note */}
          <div style={{ backgroundColor: "var(--color-light)", borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
              Your request stays active for 7 days. We'll notify you the moment we find a match — no payment needed until you decide to book.
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