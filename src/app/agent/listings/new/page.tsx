"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { STATE_NAMES, getLGAs } from "@/lib/nigeria-location";

const PROPERTY_TYPES = [
  { value: "self-con", label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat" },
  { value: "1-bed", label: "1 Bedroom Flat" },
  { value: "2-bed", label: "2 Bedroom Flat" },
  { value: "room", label: "Single Room" },
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    lga: "",
    state: "Akwa Ibom",
    price: "",
    type: "",
    landlordName: "",
    landlordPhone: "",
  });

  const [images, setImages] = useState<ImagePreview[]>([]);
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const totalAfter = images.length + files.length;
    if (totalAfter > 6) {
      setError("Maximum 6 images allowed.");
      return;
    }

    const newPreviews: ImagePreview[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newPreviews]);
    setError("");

    // Reset input so same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validations
    if (!form.type) {
      setError("Please select a property type.");
      return;
    }
    if (!form.lga) {
      setError("Please select an LGA.");
      return;
    }
    const priceNum = parseInt(form.price.replace(/,/g, ""));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid annual rent.");
      return;
    }
    if (images.length < 2) {
      setError("Please upload at least 2 photos of the property.");
      return;
    }

    setLoading(true);

    try {
      // Step 1 — upload images to Cloudinary
      setUploadProgress("Uploading photos...");
      const formData = new FormData();
      images.forEach((img) => formData.append("images", img.file));

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Image upload failed. Try again.");
        setLoading(false);
        setUploadProgress("");
        return;
      }

      const imageUrls: string[] = uploadData.urls;

      // Step 2 — create listing
      setUploadProgress("Saving listing...");
      const createRes = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: priceNum,
          images: imageUrls,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.error ?? "Failed to save listing. Try again.");
        setLoading(false);
        setUploadProgress("");
        return;
      }

      // Success
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── DARK HEADER ── */}
      <header
        className="sticky top-0 z-50 px-4 py-4"
        style={{ backgroundColor: "#1B2E1B" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ border: "1px solid #2E7D32" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="#C8E6C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="text-xs" style={{ color: "#7A9A7A", letterSpacing: "0.5px" }}>
              AGENT
            </p>
            <p className="text-sm font-semibold"
              style={{ color: "#E8F5E9", fontFamily: "var(--font-heading)" }}>
              Add New Listing
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── PROPERTY DETAILS ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Property Details
            </p>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Listing title
              </label>
              <input
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Self-contained, Uyo Road"
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the property — facilities, nearby landmarks, what's included..."
                required
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Property type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              >
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
                Annual rent (₦)
              </label>
              <input
                name="price"
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 150000"
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
              {formattedPrice && !isNaN(formattedPrice) && formattedPrice > 0 && (
                <p className="text-xs mt-1.5" style={{ color: "var(--color-primary)" }}>
                  ₦{formattedPrice.toLocaleString()} per year
                </p>
              )}
            </div>
          </div>

          {/* ── LOCATION ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
              Location
            </p>

            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                State
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              >
                {STATE_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* LGA */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                LGA
              </label>
              <select
                name="lga"
                value={form.lga}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              >
                <option value="">Select LGA</option>
                {lgaOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Full address
              </label>
              <input
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 12 Aka Road, Uyo"
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── PHOTOS ── */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-heading)" }}>
                Photos
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                Minimum 2 photos, maximum 5. Clear photos get more bookings.
              </p>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--color-border)" }}>
                    <img
                      src={img.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#E53935" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    {index === 0 && (
                      <span
                        className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: "#2E7D32", color: "#fff", fontSize: "10px" }}
                      >
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                {/* Add more button */}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                    style={{
                      border: "1.5px dashed var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Initial upload button — shown when no images yet */}
            {images.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{
                  border: "1.5px dashed var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-text-muted)" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="var(--color-text-muted)" strokeWidth="1.5" />
                  <path d="M21 15l-5-5L5 21" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Tap to add photos
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  At least 2 required
                </p>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image count indicator */}
            {images.length > 0 && (
              <p className="text-xs" style={{
                color: images.length >= 2 ? "var(--color-primary)" : "var(--color-text-muted)"
              }}>
                {images.length}/5 photos added
                {images.length < 2 && " — add at least 2"}
              </p>
            )}
          </div>

          {/* ── LANDLORD DETAILS ── */}
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

            {/* Landlord name */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Landlord full name
              </label>
              <input
                name="landlordName"
                type="text"
                value={form.landlordName}
                onChange={handleChange}
                placeholder="e.g. Chief Udo Bassey"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            {/* Landlord phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}>
                Landlord phone number
              </label>
              <input
                name="landlordPhone"
                type="tel"
                value={form.landlordPhone}
                onChange={handleChange}
                placeholder="e.g. 08012345678"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm px-1" style={{ color: "#E53935" }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#2E7D32", fontFamily: "var(--font-heading)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {uploadProgress || "Saving..."}
              </>
            ) : (
              "Submit listing"
            )}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
            Your listing will be reviewed before going live.
          </p>

        </form>
      </div>
    </div>
  );
}