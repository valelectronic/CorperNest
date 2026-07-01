"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "self-con",  label: "Self Contained",  desc: "Single room with private bathroom & kitchen" },
  { value: "mini-flat", label: "Mini Flat",        desc: "Bedroom, sitting area, kitchen & bathroom" },
  { value: "1-bed",     label: "1 Bedroom Flat",   desc: "1 bedroom, living room, kitchen & bathroom" },
  { value: "2-bed",     label: "2 Bedroom Flat",   desc: "2 bedrooms, living room, kitchen & bathroom" },
  { value: "3-bed",     label: "3 Bedroom Flat",   desc: "3 bedrooms, living room, kitchen & bathroom" },
  { value: "room",      label: "Single Room",      desc: "One room, shared bathroom or kitchen" },
];

const AGENCY_FEE_OPTIONS = [
  { value: 5,  label: "5%"              },
  { value: 8,  label: "8%"              },
  { value: 10, label: "10% — standard"  },
  { value: 12, label: "12%"             },
  { value: 15, label: "15%"             },
];

const AMENITIES = [
  { slug: "running-water",    label: "Running water",             icon: "💧" },
  { slug: "prepaid-meter",    label: "Prepaid meter",             icon: "⚡" },
  { slug: "band-a-light",     label: "Band A light",              icon: "🔆" },
  { slug: "band-b-light",     label: "Band B light",              icon: "💡" },
  { slug: "tiled-floors",     label: "Tiled floors",              icon: "🪟" },
  { slug: "ceiling-fan",      label: "Ceiling fan",               icon: "🌀" },
  { slug: "furnished",        label: "Furnished",                 icon: "🛋️" },
  { slug: "kitchen",          label: "Kitchen",                   icon: "🍳" },
  { slug: "bathroom-inside",  label: "Bathroom inside",           icon: "🚿" },
  { slug: "security-gate",    label: "Security / Gate",           icon: "🔒" },
  { slug: "parking-space",    label: "Parking space",             icon: "🚗" },
  { slug: "fence-compound",   label: "Fence compound",            icon: "🏠" },
  { slug: "good-road-access", label: "Good road access",          icon: "🛣️" },
  { slug: "close-to-nysc",    label: "Close to NYSC secretariat", icon: "📍" },
  { slug: "good-network",     label: "Good network coverage",     icon: "📶" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((t) => [t.value, t.label])
);

const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.slug, a.label])
);

const inputStyle = {
  border: "1.5px solid var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  width: "100%",
  borderRadius: 12,
  padding: "13px 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

// Each image has a stable ID assigned at selection time. All upload
// callbacks use this ID — never the array index — so removing or
// reordering images mid-upload can't corrupt the wrong entry.
type ImageStatus = "pending" | "uploading" | "done" | "error";
type ImagePreview = {
  id:           string;
  file:         File;
  previewUrl:   string;
  status:       ImageStatus;
  uploadedUrl?: string;
  errorMsg?:    string;
};

type DuplicateWarning = {
  count:    number;
  examples: { title: string; landmark: string; status: string }[];
};

// ─── AUTO-GENERATED DESCRIPTION ────────────────────────────────────────────
// Replaces the old free-text description field. Built entirely from
// structured data the agent already provides (type, landmark, amenities)
// — removing the "blank page" burden of writing prose from scratch, while
// still giving every listing a real, readable description on the detail
// page and in search results, since the backend and detail page both
// expect this field to exist.
function buildAutoDescription(
  type: string,
  purpose: "rent" | "sale",
  landmark: string,
  amenitySlugs: string[],
  customAmenities: string[]
): string {
  const typeLabel = TYPE_LABELS[type] ?? type;
  const allAmenityLabels = [
    ...amenitySlugs.map((s) => AMENITY_LABELS[s]).filter(Boolean),
    ...customAmenities,
  ];

  let text = `${typeLabel} available ${purpose === "sale" ? "for sale" : "for rent"}`;
  if (landmark.trim()) text += `, near ${landmark.trim()}`;
  text += ".";

  if (allAmenityLabels.length > 0) {
    text += ` Comes with: ${allAmenityLabels.join(", ")}.`;
  }

  return text;
}

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

function SectionCard({
  num, title, subtitle, children,
}: {
  num: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
          {num}
        </span>
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", margin: 0 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "3px 0 0", lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, hint, optional, children,
}: {
  label: string; hint?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hint ? 4 : 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>{label}</label>
        {optional && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", padding: "2px 7px", borderRadius: 20, background: "var(--color-bg)", border: "1px solid var(--color-border)", letterSpacing: "0.03em" }}>
            OPTIONAL
          </span>
        )}
      </div>
      {hint && <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 8px", lineHeight: 1.55 }}>{hint}</p>}
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function NewListingPage() {
  const router           = useRouter();
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const customAmenityRef = useRef<HTMLInputElement>(null);
  const dupTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    address:          "",
    landmark:         "",
    lga:              "",
    state:            "Akwa Ibom",
    price:            "",
    type:             "",
    listingPurpose:   "rent" as "rent" | "sale",
    landlordName:     "",
    landlordPhone:    "",
    agencyFeePercent: "" as "" | number,
  });

  const [images,            setImages]            = useState<ImagePreview[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenities,   setCustomAmenities]   = useState<string[]>([]);
  const [customInput,       setCustomInput]       = useState("");
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [uploadProgress,    setUploadProgress]    = useState("");

  const [duplicateWarning,    setDuplicateWarning]    = useState<DuplicateWarning | null>(null);
  const [checkingDuplicate,   setCheckingDuplicate]   = useState(false);

  const lgaOptions = getLGAs(form.state);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => name === "state" ? { ...prev, state: value, lga: "" } : { ...prev, [name]: value });
  }

  function triggerDuplicateCheck(landmarkVal: string, lgaVal: string, typeVal: string) {
    if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
    if (!landmarkVal || landmarkVal.trim().length < 5 || !lgaVal || !typeVal) {
      setDuplicateWarning(null);
      return;
    }
    dupTimerRef.current = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const params = new URLSearchParams({
          landmark: landmarkVal.trim(),
          lga:      lgaVal,
          type:     typeVal,
        });
        const res  = await fetch(`/api/properties/check-duplicate?${params}`);
        const data = await res.json();
        setDuplicateWarning(data.duplicate ? { count: data.count, examples: data.examples } : null);
      } catch {
        setDuplicateWarning(null);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 800);
  }

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) => prev.includes(slug) ? prev.filter((a) => a !== slug) : [...prev, slug]);
  }

  function addCustomAmenity() {
    const val = customInput.trim();
    if (!val || customAmenities.length >= 10) return;
    if (customAmenities.map((a) => a.toLowerCase()).includes(val.toLowerCase())) return;
    setCustomAmenities((prev) => [...prev, val]);
    setCustomInput("");
    customAmenityRef.current?.focus();
  }

  function removeCustomAmenity(i: number) {
    setCustomAmenities((prev) => prev.filter((_, idx) => idx !== i));
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const MAX_PHOTOS    = 5;

  async function uploadSingle(id: string, file: File): Promise<void> {
    // Mark by ID — never by index, so concurrent removes can't corrupt state
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, status: "uploading" } : img));

    try {
      const fd = new FormData();
      fd.append("images", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.urls?.[0]) {
        setImages((prev) => prev.map((img) =>
          img.id === id ? { ...img, status: "error", errorMsg: data.error ?? "Upload failed — tap × to remove and try again" } : img
        ));
        return;
      }

      // If this image was removed before the upload finished, this map
      // simply finds no match and returns prev unchanged — no corruption
      setImages((prev) => prev.map((img) =>
        img.id === id ? { ...img, status: "done", uploadedUrl: data.urls[0] } : img
      ));
    } catch {
      setImages((prev) => prev.map((img) =>
        img.id === id ? { ...img, status: "error", errorMsg: "Network error — tap × to remove and try again" } : img
      ));
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    // ── Block video and non-image files explicitly ───────────────────────
    const invalid = picked.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid.length > 0) {
      setError(`${invalid.map((f) => f.name).join(", ")} — only JPEG, PNG and WebP photos are allowed. Videos cannot be uploaded.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // ── Hard cap at MAX_PHOTOS — reject the whole batch if it would overflow ──
    const remaining = MAX_PHOTOS - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos reached. Remove one to add another.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const toAdd = picked.slice(0, remaining);
    if (picked.length > remaining) {
      setError(`Only ${remaining} more photo${remaining > 1 ? "s" : ""} allowed — added the first ${remaining}.`);
    } else {
      setError("");
    }

    // Add all selected images immediately with stable IDs, then kick off
    // parallel uploads. The agent continues filling the form while photos
    // upload in the background. Remove-and-replace works correctly because
    // uploads track by ID, not array position.
    const newEntries: ImagePreview[] = toAdd.map((file) => ({
      id:         `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status:     "pending" as ImageStatus,
    }));

    setImages((prev) => [...prev, ...newEntries]);

    // Fire uploads OUTSIDE the state setter — same reason as removeImage:
    // React Strict Mode calls state updaters twice to catch side effects,
    // which was causing every image to upload to Cloudinary twice.
    newEntries.forEach((entry) => {
      setTimeout(() => uploadSingle(entry.id, entry.file), 50);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(id: string) {
    // Find the target BEFORE touching state — the state setter must stay
    // a pure function. Calling fetch() inside setImages is a side effect
    // inside a state updater, which React can call multiple times in
    // StrictMode and which caused the Cloudinary delete to never fire.
    const target = images.find((img) => img.id === id);

    if (target) {
      URL.revokeObjectURL(target.previewUrl);

      // Delete from Cloudinary if this photo finished uploading —
      // fire-and-forget, UI updates immediately regardless of outcome
      if (target.status === "done" && target.uploadedUrl) {
        fetch("/api/upload/delete", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url: target.uploadedUrl }),
        }).catch(() => {
          console.warn("[removeImage] Cloudinary delete failed for:", target.uploadedUrl);
        });
      }
    }

    // State update is now a pure filter — no side effects inside
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  const priceNum       = parseInt(form.price.replace(/,/g, "")) || 0;
  const agencyFeeNaira = form.agencyFeePercent && priceNum > 0
    ? Math.round(priceNum * (Number(form.agencyFeePercent) / 100))
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.type)            { setError("Please select a property type."); return; }
    if (!form.lga)             { setError("Please select your LGA."); return; }
    if (!form.landmark.trim()) { setError("Please enter the nearest landmark — this helps clients find the property."); return; }
    if (!priceNum || priceNum <= 0) { setError("Please enter a valid price."); return; }
    if (images.length < 2) { setError("Please upload at least 2 photos."); return; }

    // Check every photo finished uploading — some might still be in progress
    const stillUploading = images.some((img) => img.status === "uploading" || img.status === "pending");
    if (stillUploading) { setError("Photos are still uploading — wait a moment then try again."); return; }

    const failedUploads = images.filter((img) => img.status === "error");
    if (failedUploads.length > 0) { setError("Some photos failed to upload. Remove them and add again."); return; }

    const imageUrls = images.map((img) => img.uploadedUrl!);

    // Auto-built from type + landmark + amenities — no manual writing required
    const description = buildAutoDescription(
      form.type, form.listingPurpose, form.landmark, selectedAmenities, customAmenities
    );

    setLoading(true);
    try {
      setUploadProgress("Saving listing…");
      const res  = await fetch("/api/properties/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          description,
          price:            priceNum,
          images:           imageUrls,
          amenities:        selectedAmenities,
          customAmenities,
          agencyFeePercent: form.agencyFeePercent ? Number(form.agencyFeePercent) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save listing."); setLoading(false); setUploadProgress(""); return; }
      router.push("/agent");
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
      setUploadProgress("");
    }
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh" }}>

      {/* ── HEADER ── */}
      <header style={{ backgroundColor: "#1B2E1B", padding: "14px 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #2E7D32", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#C8E6C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p style={{ fontSize: 10, color: "#7A9A7A", letterSpacing: "0.06em", fontFamily: "var(--font-mono)", margin: 0 }}>AGENT</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#E8F5E9", fontFamily: "var(--font-heading)", margin: 0 }}>Add New Listing</p>
          </div>
        </div>
      </header>

      {/* ── HINT BAR ── */}
      <div style={{ background: "var(--color-light)", borderBottom: "1px solid var(--color-border)", padding: "10px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--color-primary)", margin: 0, fontWeight: 600 }}>
          Fill all sections carefully — honest listings get approved faster and attract more bookings
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── 1. WHAT ARE YOU LISTING ── */}
          <SectionCard num="1" title="What are you listing?" subtitle="Select the type and purpose of this property">

            <Field label="Purpose">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["rent", "sale"] as const).map((p) => (
                  <button key={p} type="button"
                    onClick={() => setForm((prev) => ({ ...prev, listingPurpose: p }))}
                    style={{ padding: "13px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-heading)", border: "1.5px solid", backgroundColor: form.listingPurpose === p ? "var(--color-primary)" : "var(--color-bg)", color: form.listingPurpose === p ? "#fff" : "var(--color-text-secondary)", borderColor: form.listingPurpose === p ? "var(--color-primary)" : "var(--color-border)" }}>
                    {p === "rent" ? "🏠 For Rent" : "💰 For Sale"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Property type" hint="Choose the option that best matches your property">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PROPERTY_TYPES.map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, type: t.value }));
                      triggerDuplicateCheck(form.landmark, form.lga, t.value);
                    }}
                    style={{ padding: "12px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: "left", cursor: "pointer", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: form.type === t.value ? "var(--color-light)" : "var(--color-bg)", color: form.type === t.value ? "var(--color-primary)" : "var(--color-text-secondary)", borderColor: form.type === t.value ? "var(--color-primary)" : "var(--color-border)" }}>
                    <div>
                      <span style={{ display: "block", fontWeight: 700 }}>{t.label}</span>
                      <span style={{ fontSize: 11, color: form.type === t.value ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: 400 }}>{t.desc}</span>
                    </div>
                    {form.type === t.value && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
                        <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>

          {/* ── 2. PRICING ── */}
          <SectionCard num="2" title="Pricing" subtitle="Set the price and your agency fee so clients know upfront">

            <Field label={form.listingPurpose === "sale" ? "Selling price (₦)" : "Annual rent (₦)"}
              hint={form.listingPurpose === "rent" ? "Enter the full annual rent. E.g. type 150000 for ₦150,000 per year." : "Enter the total selling price in naira."}>
              <input name="price" type="text" inputMode="numeric"
                value={form.price} onChange={handleChange} required
                placeholder="e.g. 150000" style={inputStyle} />
              {priceNum > 0 && (
                <p style={{ fontSize: 12, color: "var(--color-primary)", margin: "6px 0 0", fontWeight: 600 }}>
                  ₦{priceNum.toLocaleString()} {form.listingPurpose === "sale" ? "— one-time" : "per year"}
                </p>
              )}
            </Field>

            <Field label="Your agency fee" optional
              hint="The percentage you charge the client after they secure the property. Clients see this before booking — it builds trust and avoids surprises.">
              <select name="agencyFeePercent" value={form.agencyFeePercent} onChange={handleChange} style={inputStyle}>
                <option value="">Not set — I'll discuss with client directly</option>
                {AGENCY_FEE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {agencyFeeNaira !== null && (
                <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 4px" }}>Client will pay you after securing property:</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "var(--color-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>₦{agencyFeeNaira.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "3px 0 0" }}>{form.agencyFeePercent}% of ₦{priceNum.toLocaleString()} annual rent</p>
                </div>
              )}
            </Field>
          </SectionCard>

          {/* ── 3. LOCATION ── */}
          <SectionCard num="3" title="Location" subtitle="Be specific — clients use location to decide if the property is convenient">

            <Field label="State">
              <select name="state" value={form.state} onChange={handleChange} required style={inputStyle}>
                {STATE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="LGA">
              <select name="lga" value={form.lga}
                onChange={(e) => {
                  handleChange(e);
                  triggerDuplicateCheck(form.landmark, e.target.value, form.type);
                }}
                required style={inputStyle}>
                <option value="">Select LGA</option>
                {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            <Field label="Nearest landmark"
              hint="This is the most important field for location. Clients in Eket navigate by landmarks, not street names. Be very specific.">
              <input name="landmark" type="text" value={form.landmark}
                onChange={(e) => {
                  handleChange(e);
                  triggerDuplicateCheck(e.target.value, form.lga, form.type);
                }}
                required
                placeholder="e.g. Behind NYSC secretariat Eket, Opposite Eket market, Close to Total filling station Eket"
                style={inputStyle} />

              {form.landmark.trim() && !duplicateWarning && !checkingDuplicate && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" stroke="var(--color-primary)" strokeWidth="1.8" />
                    <circle cx="12" cy="10" r="3" stroke="var(--color-primary)" strokeWidth="1.8" />
                  </svg>
                  <p style={{ fontSize: 12, color: "var(--color-primary)", margin: 0, fontWeight: 600 }}>{form.landmark}</p>
                </div>
              )}

              {checkingDuplicate && (
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Checking for similar listings…
                </p>
              )}

              {duplicateWarning && !checkingDuplicate && (
                <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 12, background: "#FFF8E1", border: "1px solid #FAC775" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                    ⚠️ Similar listing already exists near this landmark
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#B45309", lineHeight: 1.5 }}>
                    {duplicateWarning.count} active listing{duplicateWarning.count > 1 ? "s" : ""} found near this landmark with the same property type. If this is a different unit, continue — our team will verify before approving.
                  </p>
                  {duplicateWarning.examples.map((ex, i) => (
                    <p key={i} style={{ margin: "0 0 2px", fontSize: 11, color: "#92400E" }}>
                      • {ex.title} — {ex.landmark}
                    </p>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Full address"
              hint="The exact address is hidden from clients until they book and schedule a visit. Write it accurately.">
              <input name="address" type="text" value={form.address}
                onChange={handleChange} required
                placeholder="e.g. No. 12 Aba Road, Eket" style={inputStyle} />
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
                🔒 Only revealed after client pays and schedules a visit
              </p>
            </Field>
          </SectionCard>

          {/* ── 4. AMENITIES — description removed, this now does ALL the descriptive
               work. The agent just ticks what's actually there; we build the
               readable description automatically from this before saving. ── */}
          <SectionCard num="4" title="What does this property have?"
            subtitle="Tick only what is actually available — this is what clients see, no need to write anything extra.">

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AMENITIES.map((a) => {
                const selected = selectedAmenities.includes(a.slug);
                return (
                  <button key={a.slug} type="button" onClick={() => toggleAmenity(a.slug)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid", backgroundColor: selected ? "var(--color-light)" : "var(--color-bg)", color: selected ? "var(--color-primary)" : "var(--color-text-secondary)", borderColor: selected ? "var(--color-primary)" : "var(--color-border)" }}>
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAmenities.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, margin: 0 }}>
                {selectedAmenities.length} amenit{selectedAmenities.length === 1 ? "y" : "ies"} selected
              </p>
            )}

            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Anything else? Add your own</p>
              {customAmenities.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {customAmenities.map((a, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "var(--color-light)", border: "1.5px solid var(--color-primary)", color: "var(--color-primary)" }}>
                      {a}
                      <button type="button" onClick={() => removeCustomAmenity(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {customAmenities.length < 10 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={customAmenityRef} type="text" value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                    placeholder="e.g. Boys quarters, Swimming pool…" maxLength={40}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={addCustomAmenity} disabled={!customInput.trim()}
                    style={{ padding: "0 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--color-light)", color: "var(--color-primary)", border: "1.5px solid var(--color-border)", cursor: "pointer", opacity: customInput.trim() ? 1 : 0.4 }}>
                    Add
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── 5. PHOTOS ── */}
          <SectionCard num="5" title="Photos"
            subtitle="Upload clear photos of: living room, bedroom, bathroom, kitchen, and compound. Good photos = more bookings.">

            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {images.map((img) => (
                  <div key={img.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${img.status === "error" ? "#E53935" : img.status === "done" ? "#43A047" : "var(--color-border)"}` }}>
                    <img src={img.previewUrl} alt="Photo" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: img.status === "uploading" || img.status === "pending" ? 0.5 : 1 }} />

                    {/* Per-image status overlay */}
                    {(img.status === "uploading" || img.status === "pending") && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                        <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, marginTop: 5 }}>UPLOADING</span>
                      </div>
                    )}
                    {img.status === "done" && (
                      <div style={{ position: "absolute", bottom: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "#43A047", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {img.status === "error" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(229,57,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, background: "#E53935", padding: "2px 6px", borderRadius: 6, textAlign: "center" }}>FAILED</span>
                      </div>
                    )}

                    {/* Remove button — always visible, uses stable ID */}
                    <button type="button" onClick={() => removeImage(img.id)}
                      style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "#E53935", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>

                    {images[0]?.id === img.id && img.status === "done" && (
                      <span style={{ position: "absolute", bottom: 6, left: 6, padding: "2px 7px", borderRadius: 6, background: "#2E7D32", color: "#fff", fontSize: 10, fontWeight: 700 }}>Cover</span>
                    )}
                  </div>
                ))}

                {/* Add more — only shown if under the limit */}
                {images.length < MAX_PHOTOS && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ aspectRatio: "1", borderRadius: 12, border: "1.5px dashed var(--color-border)", background: "var(--color-bg)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Add</span>
                  </button>
                )}
              </div>
            )}

            {images.length === 0 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", padding: "36px 0", borderRadius: 14, border: "1.5px dashed var(--color-border)", background: "var(--color-bg)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.4" />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="var(--color-text-muted)" strokeWidth="1.4" />
                  <path d="M21 15l-5-5L5 21" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)", margin: 0 }}>Tap to add photos</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 0" }}>Minimum 2 · Maximum 5</p>
                </div>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple onChange={handleImageSelect} style={{ display: "none" }} />

            {images.length > 0 && (
              <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: images.filter(i => i.status === "done").length >= 2 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                {images.filter(i => i.status === "done").length}/{MAX_PHOTOS} photos uploaded
                {images.some(i => i.status === "uploading" || i.status === "pending") && " · uploading…"}
                {images.filter(i => i.status === "done").length >= 2 && " ✓"}
              </p>
            )}
          </SectionCard>

          {/* ── 6. LANDLORD DETAILS (OPTIONAL) ── */}
          <SectionCard num="6" title="Landlord details"
            subtitle="Optional — helps us resolve disputes faster if they arise. We will not contact the landlord without your knowledge.">

            <Field label="Landlord / Caretaker name" optional>
              <input name="landlordName" type="text" value={form.landlordName}
                onChange={handleChange} placeholder="e.g. Chief Udo Bassey" style={inputStyle} />
            </Field>

            <Field label="Landlord / Caretaker phone number" optional>
              <input name="landlordPhone" type="tel" value={form.landlordPhone}
                onChange={handleChange} placeholder="e.g. 08012345678" style={inputStyle} />
            </Field>
          </SectionCard>

          {/* ── ERROR ── */}
          {error && (
            <div style={{ padding: "13px 14px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p style={{ fontSize: 13, color: "#C62828", margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          {/* ── SUBMIT ── */}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: loading ? "var(--color-border)" : "#2E7D32", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                {uploadProgress || "Saving…"}
              </>
            ) : (
              <>
                Submit listing for review
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </>
            )}
          </button>

          <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 16px" }}>
            Your listing will be reviewed by our team before going live — usually within 24 hours.
          </p>

        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}