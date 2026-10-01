// src/app/(main)/parkout/ambassador/apply/application-form.tsx
// STATE 2 of the ambassador application — shown after ₦2,000 fee is confirmed.
// Contains all form fields + terms agreement + submit button.
// Imported and rendered by apply-client.tsx when formUnlocked = true.

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AmbassadorTerms from "./terms";

type Bank = { name: string; code: string };

type Props = {
  applicationId: string;
  userName:      string | null;
};

const TERRITORIES = [
  "Eket", "Uyo", "Ikot Ekpene", "Abak", "Itu",
  "Oron", "Calabar", "Port Harcourt", "Other",
];

const ID_TYPES = [
  { value: "nysc",            label: "NYSC Call-Up Number"    },
  { value: "nin",             label: "National ID (NIN)"      },
  { value: "voters_card",     label: "Voter's Card"           },
  { value: "drivers_license", label: "Driver's License"       },
  { value: "student",         label: "Student Matric Number"  },
  { value: "passport",        label: "International Passport" },
];

function Spinner({ color = "#fff" }: { color?: string }) {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: "50%",
      border: `2px solid ${color}30`,
      borderTopColor: color,
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    }} />
  );
}

export default function ApplicationForm({ applicationId, userName }: Props) {
  const router = useRouter();

  // ── Form state ─────────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState(userName ?? "");
  const [phone,       setPhone]       = useState("");
  const [whatsapp,    setWhatsapp]    = useState("");
  const [territory,   setTerritory]   = useState("");
  const [idType,      setIdType]      = useState("");
  const [idNumber,    setIdNumber]    = useState("");
  const [idDocUrl,    setIdDocUrl]    = useState("");
  const [idUploading, setIdUploading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  // ── Bank state ─────────────────────────────────────────────────────────
  const [banks,            setBanks]            = useState<Bank[]>([]);
  const [bankSearch,       setBankSearch]       = useState("");
  const [bankCode,         setBankCode]         = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [accountNumber,    setAccountNumber]    = useState("");
  const [accountName,      setAccountName]      = useState("");
  const [bankVerified,     setBankVerified]     = useState(false);
  const [verifying,        setVerifying]        = useState(false);

  const idFileRef = useRef<HTMLInputElement>(null);

  // Load banks on mount
  useEffect(() => {
    fetch("/api/marketplace/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks ?? []))
      .catch(() => {});
  }, []);

  // Auto-verify bank when 10 digits + bank selected
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode && !bankVerified && !verifying) {
      handleVerifyBank();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber, bankCode]);

  // ── ID upload ──────────────────────────────────────────────────────────
  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (idFileRef.current) idFileRef.current.value = "";
    setIdUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/marketplace/upload-id", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      setIdDocUrl(data.url);
      toast.success("ID uploaded ✓");
    } catch { toast.error("Upload failed. Try again."); }
    finally { setIdUploading(false); }
  }

  // ── Bank verify ────────────────────────────────────────────────────────
  async function handleVerifyBank() {
    if (!accountNumber || !bankCode) return;
    setVerifying(true); setBankVerified(false); setAccountName("");
    try {
      const res  = await fetch("/api/marketplace/verify-bank", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Verification failed"); return; }
      setAccountName(data.accountName);
      setBankVerified(true);
    } catch { toast.error("Verification failed. Try again."); }
    finally { setVerifying(false); }
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!fullName.trim())  { toast.error("Enter your full name.");      return; }
    if (!phone.trim())     { toast.error("Enter your phone number.");   return; }
    if (!territory)        { toast.error("Select your territory.");     return; }
    if (!idType)           { toast.error("Select your ID type.");       return; }
    if (!idNumber.trim())  { toast.error("Enter your ID number.");      return; }
    if (!idDocUrl)         { toast.error("Upload a photo of your ID."); return; }
    if (!bankVerified)     { toast.error("Verify your bank account.");  return; }
    if (!termsAgreed)      { toast.error("You must agree to the Ambassador Terms to continue."); return; }

    setSubmitting(true);
    try {
      const res  = await fetch("/api/parkout/ambassador/apply/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          fullName:       fullName.trim(),
          phone:          phone.trim(),
          whatsappNumber: whatsapp.trim() || phone.trim(),
          territoryState: "Akwa Ibom",
          territoryLga:   territory,
          idType,
          idNumber:       idNumber.trim(),
          idDocumentUrl:  idDocUrl,
          bankCode,
          accountNumber,
          accountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Submission failed. Try again."); return; }
      router.push("/parkout/ambassador/apply/success");
    } catch { toast.error("Network error. Try again."); }
    finally { setSubmitting(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14,
    border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
    fontFamily: "var(--font-body)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)",
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg)", paddingBottom: 48 }}>

      {/* Sticky confirmed header */}
      <div style={{
        position: "sticky", top: 112, zIndex: 30,
        padding: "12px 16px",
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#15803D" }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", margin: 0 }}>
            Payment confirmed ✓ — Complete your application
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Personal details ── */}
        <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 14px" }}>
            Personal Details
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="As it appears on your ID" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678" type="tel" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>
              WhatsApp number{" "}
              <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(if different from phone)</span>
            </label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Leave blank if same as phone above" type="tel" style={inputStyle} />
          </div>
        </div>

        {/* ── Territory ── */}
        <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
            Your Territory
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
            Select the area where you live and can handle inspections
          </p>
          <select value={territory} onChange={(e) => setTerritory(e.target.value)} style={inputStyle}>
            <option value="">Select your LGA / area</option>
            {TERRITORIES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* ── Identity verification ── */}
        <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
            Identity Verification
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
            Any valid Nigerian ID — corper, student, worker or adult citizen
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ID type</label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)} style={inputStyle}>
              <option value="">Select your ID type</option>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ID number</label>
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter your ID number" style={inputStyle} />
          </div>

          {/* ID photo upload */}
          <div>
            <label style={labelStyle}>Upload ID photo</label>
            {idDocUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1.5px solid #A5D6A7" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#2E7D32" />
                  <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32", margin: 0 }}>ID photo uploaded ✓</p>
                <button type="button" onClick={() => setIdDocUrl("")}
                  style={{ marginLeft: "auto", fontSize: 11, color: "#C62828", background: "none", border: "none", cursor: "pointer" }}>
                  Change
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => idFileRef.current?.click()}
                disabled={idUploading}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  border: "1.5px dashed var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  cursor: idUploading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {idUploading
                  ? <><Spinner color="var(--color-primary)" /><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Uploading…</span></>
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                          stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>Upload ID photo</span>
                    </>
                }
              </button>
            )}
            <input ref={idFileRef} type="file" accept="image/*" hidden onChange={handleIdUpload} />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              Clear photo of your ID document
            </p>
          </div>
        </div>

        {/* ── Bank details ── */}
        <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
            Bank Account for Ambassador Payments
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
            Payments for completed Ambassador assignments are paid to this verified account
          </p>

          {/* Bank search */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Bank</label>
            <div style={{ position: "relative" }}>
              <input
                type="text" value={bankSearch}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  setBankDropdownOpen(true);
                  if (bankCode) { setBankCode(""); setBankVerified(false); setAccountName(""); }
                }}
                onFocus={() => setBankDropdownOpen(true)}
                onBlur={() => setTimeout(() => setBankDropdownOpen(false), 150)}
                placeholder={banks.length ? "Search your bank…" : "Loading banks…"}
                style={inputStyle}
                autoComplete="off"
              />
              {bankCode && !bankDropdownOpen && (
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              {bankDropdownOpen && banks.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                  backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)",
                  borderRadius: 12, maxHeight: 220, overflowY: "auto",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                }}>
                  {banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())).length === 0
                    ? <p style={{ padding: "12px 14px", fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No bank found</p>
                    : banks
                        .filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                        .map((b, i, arr) => (
                          <button key={b.code} type="button"
                            onMouseDown={() => {
                              setBankCode(b.code);
                              setBankSearch(b.name);
                              setBankDropdownOpen(false);
                              if (b.code !== bankCode) { setBankVerified(false); setAccountName(""); }
                            }}
                            style={{
                              display: "block", width: "100%", textAlign: "left",
                              padding: "11px 14px", fontSize: 13, cursor: "pointer",
                              color: bankCode === b.code ? "var(--color-primary)" : "var(--color-text)",
                              backgroundColor: bankCode === b.code ? "var(--color-light)" : "transparent",
                              border: "none",
                              borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
                              fontWeight: bankCode === b.code ? 600 : 400,
                            }}>
                            {b.name}
                          </button>
                        ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Account number */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Account number</label>
            <input
              type="text" inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 10);
                setAccountNumber(d);
                if (d.length < 10) { setBankVerified(false); setAccountName(""); }
              }}
              placeholder="10-digit account number"
              maxLength={10}
              style={inputStyle}
            />
          </div>

          {/* Verifying */}
          {verifying && (
            <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
              <Spinner color="var(--color-primary)" />
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Verifying account…</p>
            </div>
          )}

          {/* Verified */}
          {bankVerified && accountName && (
            <div style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1.5px solid #A5D6A7" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32", margin: "0 0 2px" }}>✓ Account verified</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{accountName}</p>
            </div>
          )}
        </div>

        {/* ── Terms & Conditions ── */}
        <AmbassadorTerms agreed={termsAgreed} onAgree={setTermsAgreed} />

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !termsAgreed}
          style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none",
            backgroundColor: submitting || !termsAgreed ? "var(--color-border)" : "#15803D",
            color: "#fff", fontFamily: "var(--font-heading)",
            fontWeight: 700, fontSize: 15,
            cursor: submitting || !termsAgreed ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 0.2s",
          }}
        >
          {submitting ? <><Spinner /> Submitting…</> : "Submit Application →"}
        </button>

        {!termsAgreed && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0 }}>
            Agree to the terms above to enable the submit button
          </p>
        )}

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0 }}>
          We will review your application and contact you on WhatsApp within 48 hours
        </p>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}