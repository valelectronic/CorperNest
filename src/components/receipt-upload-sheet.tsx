"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

interface Props {
  bookingId:      string;
  listingId:      string;
  listingTitle:   string;
  agentName:      string;
  // If provided, this is a re-upload after admin flagged — no payment needed
  rentRecordId?:  string;
  adminNote?:     string;
  onClose:        () => void;
  onSuccess:      () => void;
}

const DURATION_OPTIONS = [
  { value: 6,  label: "6 months" },
  { value: 12, label: "1 year"   },
  { value: 24, label: "2 years"  },
];

export default function ReceiptUploadSheet({
  bookingId, listingId, listingTitle, agentName,
  rentRecordId, adminNote,
  onClose, onSuccess,
}: Props) {
  const isReupload = !!rentRecordId;

  const [step,           setStep]           = useState<"form" | "paying">("form");
  const [rentAmount,     setRentAmount]     = useState("");
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [paymentDate,    setPaymentDate]    = useState("");
  const [receiptFile,    setReceiptFile]    = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  }

  async function handleSubmit() {
    if (!receiptFile) { toast.error("Upload your payment receipt"); return; }
    if (!isReupload) {
      if (!rentAmount || parseInt(rentAmount) <= 0) { toast.error("Enter a valid rent amount"); return; }
      if (!paymentDate) { toast.error("Select the date you paid rent"); return; }
    }

    setSubmitting(true);

    try {
      // Upload receipt to Cloudinary
      setUploading(true);
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      const uploadRes  = await fetch("/api/upload-receipt", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      setUploading(false);

      if (!uploadRes.ok) { toast.error(uploadData.error ?? "Upload failed"); return; }

      if (isReupload) {
        // Re-upload flow — no payment, just update the record
        const res  = await fetch("/api/rent-records/reupload", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rentRecordId, receiptUrl: uploadData.receiptUrl }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? "Failed to update receipt"); return; }
        toast.success("Receipt updated. Admin will review shortly.");
        onSuccess();
      } else {
        // New record — initiate ₦1,000 Paystack payment
        const initiateRes  = await fetch("/api/rent-records/initiate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            bookingId, listingId,
            rentAmount:     parseInt(rentAmount),
            durationMonths, paymentDate,
            receiptUrl:     uploadData.receiptUrl,
          }),
        });
        const initiateData = await initiateRes.json();
        if (!initiateRes.ok) { toast.error(initiateData.error ?? "Could not initiate payment"); return; }
        setStep("paying");
        window.location.href = initiateData.authorizationUrl;
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  const isLoading = uploading || submitting;
  const canSubmit = isReupload
    ? !!receiptFile
    : !!receiptFile && !!rentAmount && !!paymentDate;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} />

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        maxHeight: "92dvh", overflowY: "auto",
        paddingBottom: "env(safe-area-inset-bottom, 20px)",
        maxWidth: 640, margin: "0 auto",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
        </div>

        <div style={{ padding: "0 20px 24px" }}>

          {step === "paying" ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--color-primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 6px" }}>Redirecting to payment…</p>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>You'll be charged ₦1,000 documentation fee</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17, color: "var(--color-header)", margin: "0 0 4px" }}>
                  {isReupload ? "Update Receipt" : "Record Rent Payment"}
                </p>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
                  {listingTitle} · {agentName}
                </p>
              </div>

              {/* Admin flag reason */}
              {isReupload && adminNote && (
                <div style={{ background: "#FFEBEE", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid #FECACA" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#C62828", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
                    Why it was flagged
                  </p>
                  <p style={{ fontSize: 13, color: "#C62828", margin: 0, lineHeight: 1.5 }}>{adminNote}</p>
                </div>
              )}

              {/* Re-upload info */}
              {isReupload ? (
                <div style={{ background: "var(--color-light)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    Upload a corrected receipt below. Your rent details are already saved — no payment needed.
                  </p>
                </div>
              ) : (
                /* What you get */
                <div style={{ background: "var(--color-light)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, border: "1px solid var(--color-border)" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                    What you get for ₦1,000
                  </p>
                  {[
                    "Timestamped proof of rent payment",
                    "Dispute protection if landlord denies payment",
                    "Renewal reminder 30 days before rent expires",
                    "Agent can see your record too",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < 3 ? 6 : 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Form fields — only shown for new records, not re-uploads */}
              {!isReupload && (
                <>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Rent Amount (₦)</label>
                  <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} placeholder="e.g. 180000"
                    style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", marginBottom: 16, boxSizing: "border-box", fontFamily: "var(--font-body)" }} />

                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Rent Duration</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {DURATION_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setDurationMonths(opt.value)}
                        style={{ flex: 1, padding: "12px 8px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "1.5px solid", cursor: "pointer", fontFamily: "var(--font-heading)", borderColor: durationMonths === opt.value ? "var(--color-primary)" : "var(--color-border)", background: durationMonths === opt.value ? "var(--color-light)" : "var(--color-bg)", color: durationMonths === opt.value ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Date You Paid Rent</label>
                  <input type="date" value={paymentDate} max={today} onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", marginBottom: 16, boxSizing: "border-box" }} />

                  {paymentDate && (
                    <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 16, border: "1px solid var(--color-border)" }}>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 2px" }}>Renewal reminder will be sent on:</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                        {(() => {
                          const d = new Date(paymentDate);
                          d.setMonth(d.getMonth() + durationMonths - 1);
                          d.setDate(d.getDate() + 1);
                          return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
                        })()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Receipt upload */}
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                {isReupload ? "New Receipt (photo or PDF)" : "Payment Receipt (photo or PDF)"}
              </label>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleFileChange} style={{ display: "none" }} />

              {!receiptFile ? (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ width: "100%", padding: "20px", borderRadius: 14, border: "2px dashed var(--color-border)", background: "var(--color-bg)", cursor: "pointer", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", margin: 0 }}>Tap to upload receipt</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>JPG, PNG, WebP or PDF · Max 5MB</p>
                </button>
              ) : (
                <div style={{ marginBottom: 20 }}>
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Receipt" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, border: "1px solid var(--color-border)", marginBottom: 8 }} />
                  ) : (
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--color-bg)", border: "1px solid var(--color-border)", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M14 2v6h6" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                      <p style={{ fontSize: 13, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{receiptFile.name}</p>
                    </div>
                  )}
                  <button type="button" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                    style={{ fontSize: 12, color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                    Remove and upload different file
                  </button>
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={isLoading || !canSubmit}
                style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: isLoading || !canSubmit ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: isLoading || !canSubmit ? "not-allowed" : "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {uploading ? (
                  <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Uploading receipt…</>
                ) : submitting ? (
                  <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> {isReupload ? "Saving…" : "Preparing payment…"}</>
                ) : isReupload ? (
                  "Update Receipt — Free"
                ) : (
                  <>Save Record — Pay ₦1,000 <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></>
                )}
              </button>

              {!isReupload && (
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 10px" }}>
                  🔒 Secured by Paystack · One-time documentation fee
                </p>
              )}

              <button onClick={onClose}
                style={{ width: "100%", padding: "14px", borderRadius: 14, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", cursor: "pointer" }}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}