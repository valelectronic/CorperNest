// src/app/(main)/parkout/new/steps/step-two.tsx
// Step 2 — Photos & Proof + Transport Estimates.
// Changes from previous version:
// → landlordRules now REQUIRED (min 20 chars)
// → Transport estimates added (required, min 2 landmarks, max 3)
// → Each landmark: name + bike cost + keke cost

"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

export type TransportLandmark = {
  name:     string;
  bikeCost: string;
  kekeCost: string;
};

export type StepTwoData = {
  occupancyProofUrl:   string;
  occupancyProofType:  string;
  images:              string[];
  description:         string;
  landlordRules:       string;
  itemsAvailable:      string;
  transportEstimates:  TransportLandmark[];
};

type Props = {
  data:     StepTwoData;
  onChange: (updated: Partial<StepTwoData>) => void;
  onNext:   () => void;
  onBack:   () => void;
};

const EMPTY_LANDMARK: TransportLandmark = { name: "", bikeCost: "", kekeCost: "" };

function Spinner({ color = "var(--color-primary)" }: { color?: string }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${color}20`, borderTopColor: color, animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
  );
}

export default function StepTwo({ data, onChange, onNext, onBack }: Props) {
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

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

  // ── Proof upload ────────────────────────────────────────────────────────
  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (proofRef.current) proofRef.current.value = "";
    setUploadingProof(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/marketplace/upload-id", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed."); return; }
      onChange({ occupancyProofUrl: data.url, occupancyProofType: file.type === "application/pdf" ? "pdf" : "image" });
      toast.success("Proof uploaded ✓");
    } catch { toast.error("Upload failed. Try again."); }
    finally { setUploadingProof(false); }
  }

  // ── Photo upload ────────────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photoRef.current) photoRef.current.value = "";
    const remaining = 5 - data.images.length;
    if (remaining <= 0) { toast.error("Maximum 5 photos reached."); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) toast.info(`Uploading first ${remaining} photo${remaining > 1 ? "s" : ""} only.`);
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      toUpload.forEach((f) => form.append("images", f));
      const res  = await fetch("/api/parkout/upload-photo", { method: "POST", body: form });
      const d    = await res.json();
      if (!res.ok) { toast.error(d.error ?? "Upload failed."); return; }
      onChange({ images: [...data.images, ...(d.urls ?? [])] });
      toast.success(`${d.urls.length} photo${d.urls.length > 1 ? "s" : ""} uploaded ✓`);
    } catch { toast.error("Photo upload failed. Try again."); }
    finally { setUploadingPhoto(false); }
  }

  function removePhoto(index: number) {
    const url = data.images[index];
    onChange({ images: data.images.filter((_, i) => i !== index) });
    fetch("/api/parkout/delete-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => {});
  }

  // ── Transport helpers ───────────────────────────────────────────────────
  function updateLandmark(index: number, field: keyof TransportLandmark, value: string) {
    const updated = data.transportEstimates.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    onChange({ transportEstimates: updated });
  }

  function addLandmark() {
    if (data.transportEstimates.length >= 3) return;
    onChange({ transportEstimates: [...data.transportEstimates, { ...EMPTY_LANDMARK }] });
  }

  function removeLandmark(index: number) {
    onChange({ transportEstimates: data.transportEstimates.filter((_, i) => i !== index) });
  }

  // ── Validate and proceed ────────────────────────────────────────────────
  function handleNext() {
    if (!data.occupancyProofUrl)  { toast.error("Upload proof of occupancy."); return; }
    if (data.images.length < 3)   { toast.error("Upload at least 3 room photos."); return; }
    if (!data.landlordRules.trim() || data.landlordRules.trim().length < 20) {
      toast.error("Add landlord rules (at least 20 characters)."); return;
    }
    const validLandmarks = data.transportEstimates.filter(
      (l) => l.name.trim() && l.bikeCost && l.kekeCost
    );
    if (validLandmarks.length < 2) {
      toast.error("Add at least 2 transport landmarks with costs."); return;
    }
    onNext();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Proof of occupancy ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Proof of occupancy <span style={{ color: "#E53935" }}>*</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Rent receipt, NEPA bill, water bill or any utility showing this address. Image or PDF.
        </p>
        {data.occupancyProofUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1.5px solid #A5D6A7" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#2E7D32" /><path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32", margin: 0, flex: 1 }}>
              {data.occupancyProofType === "pdf" ? "PDF uploaded ✓" : "Photo uploaded ✓"}
            </p>
            <a href={data.occupancyProofUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#2E7D32", textDecoration: "underline" }}>View</a>
            <button type="button" onClick={() => {
              fetch("/api/marketplace/upload/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: data.occupancyProofUrl }) }).catch(() => {});
              onChange({ occupancyProofUrl: "", occupancyProofType: "" });
            }} style={{ fontSize: 11, color: "#C62828", background: "none", border: "none", cursor: "pointer", marginLeft: 4 }}>Remove</button>
          </div>
        ) : (
          <button type="button" onClick={() => proofRef.current?.click()} disabled={uploadingProof}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)", cursor: uploadingProof ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {uploadingProof
              ? <><Spinner /><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Uploading…</span></>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>Upload rent receipt / utility bill</span></>
            }
          </button>
        )}
        <input ref={proofRef} type="file" accept="image/*,.pdf" hidden onChange={handleProofUpload} />
      </div>

      {/* ── Room photos ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Room photos <span style={{ color: "#E53935" }}>*</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>{data.images.length}/5</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          Upload 3-5 clear interior photos. Show the room, bathroom, kitchen and furniture.
        </p>
        {data.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {data.images.map((url, i) => (
              <div key={url} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1" }}>
                <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button type="button" onClick={() => removePhoto(i)}
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {data.images.length < 5 && (
          <button type="button" onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)", cursor: uploadingPhoto ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {uploadingPhoto
              ? <><Spinner /><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Uploading…</span></>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-primary)" strokeWidth="1.8" /><path d="M12 8v8M8 12h8" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>{data.images.length === 0 ? "Add room photos" : "Add more photos"}</span></>
            }
          </button>
        )}
        <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
        {data.images.length > 0 && data.images.length < 3 && (
          <p style={{ fontSize: 11, color: "#E53935", margin: "8px 0 0" }}>
            Add {3 - data.images.length} more photo{3 - data.images.length > 1 ? "s" : ""} to continue
          </p>
        )}
      </div>

      {/* ── Landlord rules — REQUIRED ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>
          Landlord rules <span style={{ color: "#E53935" }}>*</span>
        </label>
        <textarea
          value={data.landlordRules}
          onChange={(e) => onChange({ landlordRules: e.target.value.slice(0, 200) })}
          placeholder="e.g. No loud music after 10pm. Working class or students only. No cooking in room."
          rows={3}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <p style={{ fontSize: 11, color: data.landlordRules.length < 20 ? "#E53935" : "var(--color-text-muted)", margin: 0 }}>
            {data.landlordRules.length < 20 ? `${20 - data.landlordRules.length} more characters needed` : "✓ Good"}
          </p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{data.landlordRules.length}/200</p>
        </div>
      </div>

      {/* ── Description (optional) ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>
          Description <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value.slice(0, 200) })}
          placeholder="Describe the room — size, ventilation, proximity to facilities…"
          rows={3}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
        />
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0", textAlign: "right" }}>{data.description.length}/200</p>
      </div>

      {/* ── Items available (optional) ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <label style={labelStyle}>
          Items available in room for sale <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
        </label>
        <textarea
          value={data.itemsAvailable}
          onChange={(e) => onChange({ itemsAvailable: e.target.value.slice(0, 300) })}
          placeholder="e.g. Fan, mattress, reading table, wardrobe (all negotiable)"
          rows={2}
          style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
        />
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0", textAlign: "right" }}>{data.itemsAvailable.length}/300</p>
      </div>

      {/* ── Transport estimates — REQUIRED ── */}
      <div style={{ borderRadius: 16, padding: "16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 4px" }}>
          Daily transport estimates <span style={{ color: "#E53935" }}>*</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
          Add commute costs from this room to key places in your area.
          Incoming tenants need this to decide. Minimum 2 landmarks.
        </p>

        {data.transportEstimates.map((landmark, index) => (
          <div key={index} style={{
            marginBottom: index < data.transportEstimates.length - 1 ? 14 : 0,
            padding: "14px",
            borderRadius: 12,
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0 }}>
                Landmark {index + 1}{index < 2 ? " *" : " (optional)"}
              </p>
              {data.transportEstimates.length > 1 && (
                <button type="button" onClick={() => removeLandmark(index)}
                  style={{ fontSize: 11, color: "#C62828", background: "none", border: "none", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Landmark name</label>
              <input
                value={landmark.name}
                onChange={(e) => updateLandmark(index, "name", e.target.value)}
                placeholder="e.g. Mobil Road PPA, Eket Market, Secretariat"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>🚲 Bike cost (₦)</label>
                <input
                  type="number" inputMode="numeric"
                  value={landmark.bikeCost}
                  onChange={(e) => updateLandmark(index, "bikeCost", e.target.value)}
                  placeholder="e.g. 100"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>🛺 Keke cost (₦)</label>
                <input
                  type="number" inputMode="numeric"
                  value={landmark.kekeCost}
                  onChange={(e) => updateLandmark(index, "kekeCost", e.target.value)}
                  placeholder="e.g. 150 or 0"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}

        {data.transportEstimates.length < 3 && (
          <button type="button" onClick={addLandmark}
            style={{ width: "100%", marginTop: 12, padding: "11px", borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "transparent", color: "var(--color-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add another landmark
          </button>
        )}

        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "8px 0 0" }}>
          Enter 0 for keke cost if keke does not go to that area
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onBack}
          style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          ← Back
        </button>
        <button type="button" onClick={handleNext}
          style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Continue to Private Details →
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}