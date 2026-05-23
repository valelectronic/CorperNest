"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

const PROPERTY_TYPES = [
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat" },
  { value: "1-bed",     label: "1 Bedroom Flat" },
  { value: "2-bed",     label: "2 Bedroom Flat" },
  { value: "room",      label: "Single Room" },
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

const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
};

type ImagePreview = {
  file: File;
  previewUrl: string;
};

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customAmenityRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    description: "",
    address: "",
    lga: "",
    state: "Akwa Ibom",
    price: "",
    type: "",
    listingPurpose: "rent" as "rent" | "sale",
    landlordName: "",
    landlordPhone: "",
  });

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const lgaOptions = getLGAs(form.state);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "state") {
      setForm((prev) => ({ ...prev, state: value, lga: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) =>
      prev.includes(slug) ? prev.filter((a) => a !== slug) : [...prev, slug]
    );
  }

  function addCustomAmenity() {
    const val = customInput.trim();
    if (!val) return;
    if (customAmenities.length >= 10) return;
    if (customAmenities.map((a) => a.toLowerCase()).includes(val.toLowerCase())) return;
    setCustomAmenities((prev) => [...prev, val]);
    setCustomInput("");
    customAmenityRef.current?.focus();
  }

  function removeCustomAmenity(index: number) {
    setCustomAmenities((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed.");
      return;
    }
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    setUploadedUrls([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
    setUploadedUrls([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.type)  { setError("Please select a property type."); return; }
    if (!form.lga)   { setError("Please select an LGA."); return; }

    const priceNum = parseInt(form.price.replace(/,/g, ""));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (images.length < 2) {
      setError("Please upload at least 2 photos.");
      return;
    }

    setLoading(true);

    try {
      // Step 1 — upload images (skipped if already done on a previous attempt)
      let imageUrls = uploadedUrls;

      if (imageUrls.length === 0) {
        setUploadProgress("Uploading photos...");
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img.file));

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Image upload failed. Try again.");
          setLoading(false);
          setUploadProgress("");
          return;
        }

        imageUrls = uploadData.urls;
        setUploadedUrls(imageUrls);
      }

      // Step 2 — create listing (title auto-generated on the server)
      setUploadProgress("Saving listing...");
      const createRes = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: priceNum,
          images: imageUrls,
          amenities: selectedAmenities,
          customAmenities,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.error ?? "Failed to save listing. Try again.");
        setLoading(false);
        setUploadProgress("");
        return;
      }

      router.push("/agent");
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
      setUploadProgress("");
    }
  }

  const formattedPrice = form.price
    ? parseInt(form.price.replace(/,/g, ""))
    : null;

  const priceLabel = form.listingPurpose === "sale" ? "Selling price (₦)" : "Annual rent (₦)";
  const priceSuffix = form.listingPurpose === "sale" ? "one-time" : "per year";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── DARK HEADER ── */}
      <header className="sticky top-0 z-50 px-4 py-4" style={{ backgroundColor: "#1B2E1B" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button type="button" onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ border: "1px solid #2E7D32" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="#C8E6C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="text-xs" style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}>AGENT</p>
            <p className="text-sm font-semibold"
              style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
              Add New Listing
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. PROPERTY DETAILS ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Property Details
            </p>

            {/* Purpose toggle — Rent or Sale */}
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--color-text-secondary)" }}>
                Purpose
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["rent", "sale"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, listingPurpose: p }))}
                    className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: form.listingPurpose === p
                        ? "var(--color-primary)" : "var(--color-bg)",
                      color: form.listingPurpose === p ? "#fff" : "var(--color-text-secondary)",
                      border: form.listingPurpose === p
                        ? "1.5px solid var(--color-primary)"
                        : "1.5px solid var(--color-border)",
                    }}
                  >
                    {p === "rent" ? "🏠 For Rent" : "💰 For Sale"}
                  </button>
                ))}
              </div>
            </div>

            {/* Property type */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Property type
              </label>
              <select name="type" value={form.type} onChange={handleChange} required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}>
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                {priceLabel}
              </label>
              <input name="price" type="text" inputMode="numeric"
                value={form.price} onChange={handleChange}
                placeholder="e.g. 150000" required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle} />
              {formattedPrice && !isNaN(formattedPrice) && formattedPrice > 0 && (
                <p className="text-xs mt-1.5" style={{ color: "var(--color-primary)" }}>
                  ₦{formattedPrice.toLocaleString()} {priceSuffix}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Description
              </label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="e.g. Spacious self-con with tiled floors, prepaid meter, good water supply. Close to NYSC secretariat."
                required rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={inputStyle} />
            </div>
          </div>

          {/* ── 2. LOCATION ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Location
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>State</label>
              <select name="state" value={form.state} onChange={handleChange} required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}>
                {STATE_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>LGA</label>
              <select name="lga" value={form.lga} onChange={handleChange} required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}>
                <option value="">Select LGA</option>
                {lgaOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>Full address</label>
              <input name="address" type="text" value={form.address}
                onChange={handleChange} placeholder="e.g. 12 Aka Road, Uyo" required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle} />
            </div>
          </div>

          {/* ── 3. AMENITIES ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
                Amenities
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                Tick everything available. Honest listings build more trust.
              </p>
            </div>

            {/* Predefined chips */}
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const selected = selectedAmenities.includes(a.slug);
                return (
                  <button key={a.slug} type="button" onClick={() => toggleAmenity(a.slug)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      backgroundColor: selected ? "var(--color-light)" : "var(--color-bg)",
                      border: selected
                        ? "1.5px solid var(--color-primary)"
                        : "1.5px solid var(--color-border)",
                      color: selected ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}>
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAmenities.length > 0 && (
              <p className="text-xs" style={{ color: "var(--color-primary)" }}>
                {selectedAmenities.length} amenit{selectedAmenities.length === 1 ? "y" : "ies"} selected
              </p>
            )}

            {/* Custom amenities */}
            <div>
              <p className="text-xs font-medium mb-2"
                style={{ color: "var(--color-text-secondary)" }}>
                Anything else? Add your own
              </p>

              {customAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {customAmenities.map((a, i) => (
                    <span key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{
                        backgroundColor: "var(--color-light)",
                        border: "1.5px solid var(--color-primary)",
                        color: "var(--color-primary)",
                      }}>
                      {a}
                      <button type="button" onClick={() => removeCustomAmenity(i)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-primary)"
                            strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {customAmenities.length < 10 && (
                <div className="flex gap-2">
                  <input ref={customAmenityRef} type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                    placeholder="e.g. Boys quarters, Swimming pool..."
                    maxLength={40}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={inputStyle} />
                  <button type="button" onClick={addCustomAmenity}
                    disabled={!customInput.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ backgroundColor: "var(--color-light)", color: "var(--color-primary)" }}>
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. PHOTOS ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
                Photos
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                Minimum 2, maximum 5. Clear photos get more bookings.
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--color-border)" }}>
                    <img src={img.previewUrl} alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#E53935" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white"
                          strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: "#2E7D32", color: "#fff", fontSize: "10px" }}>
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                    style={{ border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="var(--color-text-muted)"
                        strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Add</span>
                  </button>
                )}
              </div>
            )}

            {images.length === 0 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2"
                    stroke="var(--color-text-muted)" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5"
                    stroke="var(--color-text-muted)" strokeWidth="1.5" />
                  <path d="M21 15l-5-5L5 21" stroke="var(--color-text-muted)"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Tap to add photos
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  At least 2 required
                </p>
              </button>
            )}

            <input ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple onChange={handleImageSelect} className="hidden" />

            {images.length > 0 && (
              <p className="text-xs" style={{
                color: images.length >= 2 ? "var(--color-primary)" : "var(--color-text-muted)"
              }}>
                {images.length}/5 photos added{images.length < 2 && " — add at least 2"}
              </p>
            )}

            {uploadedUrls.length > 0 && (
              <p className="text-xs" style={{ color: "var(--color-primary)" }}>
                ✓ Photos already uploaded — will not re-upload on retry
              </p>
            )}
          </div>

          {/* ── 5. LANDLORD DETAILS ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
                Landlord Details
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                For our records only. We will reach out to verify consent before the listing goes live.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Landlord full name
              </label>
              <input name="landlordName" type="text" value={form.landlordName}
                onChange={handleChange} placeholder="e.g. Chief Udo Bassey"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Landlord phone number
              </label>
              <input name="landlordPhone" type="tel" value={form.landlordPhone}
                onChange={handleChange} placeholder="e.g. 08012345678"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle} />
            </div>
          </div>

          {error && (
            <p className="text-sm px-1" style={{ color: "#E53935" }}>{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#2E7D32", fontFamily: "var(--font-heading)" }}>
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {uploadProgress || "Saving..."}
              </>
            ) : "Submit listing"}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
            Your listing will be reviewed before going live.
          </p>

        </form>
      </div>
    </div>
  );
}