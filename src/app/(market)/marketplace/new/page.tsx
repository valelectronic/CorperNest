// src/app/(market)/marketplace/new/page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLGAs } from "@/lib/nigeria-location";
import { authClient } from "@/lib/auth-client";
import PhoneVerificationModal from "@/components/phone-verification-modal";
import NotificationPermissionPrompt from "@/components/notification-permission-prompt";
import ListingSummaryModal from "@/components/listing-summary-modal";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const DRAFT_KEY        = "corpernest_market_listing_draft";
const MAX_PRICE_CHECKS = 2;
const CACHE_TTL        = 24 * 60 * 60 * 1000;

const CATEGORIES = [
  { value: "Electronics", emoji: "📱" },
  { value: "Furniture",   emoji: "🛋️" },
  { value: "Appliances",  emoji: "🔌" },
  { value: "Kitchen",     emoji: "🍳" },
  { value: "Food",        emoji: "🍎" },
  { value: "Clothing",    emoji: "👕" },
  { value: "Books",       emoji: "📚" },
  { value: "Sports",      emoji: "🏋️" },
  { value: "Other",       emoji: "📦" },
];

// Food is a completely different form — no condition, brand, age, receipt, price check
const FOOD_CATEGORY = "Food";
const isFood = (cat: string) => cat === FOOD_CATEGORY;

const CONDITIONS = [
  { value: "new",          label: "✨ New",          body: "Never used, complete packaging"  },
  { value: "fairly-used",  label: "♻️ Fairly Used",  body: "Used but in good condition"      },
  { value: "heavily-used", label: "🔧 Heavily Used", body: "Visible wear, still functional"  },
];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT",
  "Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi",
  "Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo",
  "Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

// ── TYPES ─────────────────────────────────────────────────────────────────────

type AIPriceResult = {
  newMin:      number;
  newMax:      number;
  usedMin:     number | null;
  usedMax:     number | null;
  priceSource: string;
  context:     string;
  googleUrl:   string;
};

// ── STYLES ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12,
  border: "1.5px solid var(--color-border)", fontSize: 14,
  color: "var(--color-text)", backgroundColor: "var(--color-bg)",
  boxSizing: "border-box", fontFamily: "var(--font-body)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600,
  color: "var(--color-text-secondary)", marginBottom: 6, display: "block",
};

const priceCache = new Map<string, { data: AIPriceResult; ts: number }>();

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function NewListingPage() {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const sessionUser      = session?.user as { phoneNumber?: string | null; phoneNumberVerified?: boolean } | undefined;
  const hasVerifiedPhone = !!(sessionUser?.phoneNumber || sessionUser?.phoneNumberVerified);

  // Listing type
  const [listingType, setListingType] = useState<"single" | "bundle">("single");

  // Core fields
  const [category,    setCategory]    = useState("");
  const [condition,   setCondition]   = useState("");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [brand,       setBrand]       = useState("");
  const [itemAge,     setItemAge]     = useState("");
  const [quantity,    setQuantity]    = useState(""); // Food only
  const [bundleItems, setBundleItems] = useState<string[]>([""]);
  const [hasReceipt,  setHasReceipt]  = useState(false);
  const [delivery,    setDelivery]    = useState<"pickup" | "delivery" | "both">("pickup");

  // Location
  const [state,    setState]    = useState("Akwa Ibom");
  const [lga,      setLga]      = useState("Eket");
  const [landmark, setLandmark] = useState("");
  const lgaOptions              = getLGAs(state);

  // Photos
  const maxPhotos                    = listingType === "bundle" ? 5 : 3;
  const [images,         setImages]         = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank
  const [banks,            setBanks]           = useState<{ name: string; code: string }[]>([]);
  const [bankSearch,       setBankSearch]       = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [accountNumber,    setAccountNumber]    = useState("");
  const [bankCode,         setBankCode]         = useState("");
  const [accountName,      setAccountName]      = useState("");
  const [verifying,        setVerifying]        = useState(false);
  const [bankVerified,     setBankVerified]     = useState(false);

  // Price intelligence (non-food only)
  const [priceCheckCount,     setPriceCheckCount]     = useState(0);
  const [priceCheckAttempted, setPriceCheckAttempted] = useState(false);
  const [priceResult,         setPriceResult]         = useState<AIPriceResult | null>(null);
  const [priceError,          setPriceError]          = useState<string | null>(null);
  const [searching,           setSearching]           = useState(false);
  const [sellerPriceNote,     setSellerPriceNote]     = useState("");

  // Bulk pricing — optional, available for all categories
  const [bulkEnabled,  setBulkEnabled]  = useState(false);
  const [bulkMinQty,   setBulkMinQty]   = useState(5);
  const [bulkPrice,    setBulkPrice]    = useState("");

  // UI state
  const [agreed,               setAgreed]               = useState(false);
  const [submitting,           setSubmitting]           = useState(false);
  const [showSummary,          setShowSummary]          = useState(false);
  const [summaryPrice,         setSummaryPrice]         = useState(0);
  const [showPhoneVerify,      setShowPhoneVerify]      = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // ── Draft restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.listingType)              setListingType(d.listingType);
      if (d.category)                 setCategory(d.category);
      if (d.condition)                setCondition(d.condition);
      if (d.title)                    setTitle(d.title);
      if (d.description)              setDescription(d.description);
      if (d.price)                    setPrice(d.price);
      if (d.state)                    setState(d.state);
      if (d.lga)                      setLga(d.lga);
      if (d.landmark)                 setLandmark(d.landmark);
      if (d.bundleItems?.length)      setBundleItems(d.bundleItems);
      if (d.images?.length)           setImages(d.images);
      if (d.hasReceipt !== undefined) setHasReceipt(d.hasReceipt);
      if (d.delivery)                 setDelivery(d.delivery);
      if (d.brand)                    setBrand(d.brand);
      if (d.itemAge)                  setItemAge(d.itemAge);
      if (d.quantity)                 setQuantity(d.quantity);
      if (d.sellerPriceNote)          setSellerPriceNote(d.sellerPriceNote);
      if (d.bulkEnabled !== undefined) setBulkEnabled(d.bulkEnabled);
      if (d.bulkMinQty)               setBulkMinQty(d.bulkMinQty);
      if (d.bulkPrice)                setBulkPrice(d.bulkPrice);
      if (saved !== "{}") toast("Draft restored — continue where you left off.", { duration: 3000 });
    } catch { /* silent */ }
  }, []);

  // ── Draft save ────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          listingType, category, condition, title, description,
          price, state, lga, landmark, bundleItems, images,
          hasReceipt, delivery, brand, itemAge, quantity, sellerPriceNote,
          bulkEnabled, bulkMinQty, bulkPrice,
        }));
      } catch { /* silent */ }
    }, 600);
    return () => clearTimeout(t);
  }, [listingType, category, condition, title, description, price, state, lga, landmark, bundleItems, images, hasReceipt, delivery, brand, itemAge, quantity, sellerPriceNote]);

  // ── Load banks ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/marketplace/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks ?? []))
      .catch(() => {});
  }, []);

  // ── Load saved seller bank details ────────────────────────────────────────
  useEffect(() => {
    fetch("/api/marketplace/seller-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.marketSellerVerified && data.marketAccountName) {
          setAccountNumber(data.marketAccountNumber ?? "");
          setBankCode(data.marketBankCode ?? "");
          setBankSearch(banks.find((b) => b.code === data.marketBankCode)?.name ?? data.marketBankCode ?? "");
          setAccountName(data.marketAccountName);
          setBankVerified(true);
        }
      })
      .catch(() => {});
  }, [banks]);

  // ── Auto-trigger bank verification ────────────────────────────────────────
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode && !bankVerified && !verifying) {
      handleVerifyBank();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber, bankCode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function switchType(type: "single" | "bundle") {
    setListingType(type);
    setCondition("");
    setPriceResult(null);
    setPriceError(null);
    setImages([]);
    if (type === "bundle") setBundleItems([""]);
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    // Reset fields that do not apply across category types
    setCondition("");
    setBrand("");
    setItemAge("");
    setQuantity("");
    setBulkEnabled(false);
    setBulkPrice("");
    setBulkMinQty(5);
    setPriceResult(null);
    setPriceError(null);
    setPriceCheckAttempted(false);
  }

  function updateBundleItem(index: number, value: string) {
    setBundleItems((prev) => prev.map((item, i) => i === index ? value : item));
  }
  function addBundleItem() {
    if (bundleItems.length >= 15) return;
    setBundleItems((prev) => [...prev, ""]);
  }
  function removeBundleItem(index: number) {
    if (bundleItems.length <= 1) return;
    setBundleItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Price intelligence (non-food only) ────────────────────────────────────
  const searchPrice = useCallback(async () => {
    if (priceCheckCount >= MAX_PRICE_CHECKS) return;
    if (!title.trim() || !category) return;

    const cleanBundle = bundleItems.filter((s) => s.trim());
    const cacheKey    = `${listingType}__${title.trim()}__${cleanBundle.join(",")}__${condition}__${brand}__${itemAge}__${images[0] ? "img" : "noimg"}`.toLowerCase();
    const cached      = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPriceResult(cached.data);
      setPriceError(null);
      setPriceCheckAttempted(true);
      return;
    }

    setPriceCheckCount((n) => n + 1);
    setPriceCheckAttempted(true);
    setSearching(true);
    setPriceResult(null);
    setPriceError(null);

    try {
      const params = new URLSearchParams({ title: title.trim(), category, condition, listingType });
      if (brand.trim())       params.set("brand",       brand.trim());
      if (itemAge)            params.set("itemAge",     itemAge);
      if (images[0])          params.set("imageUrl",    images[0]);
      if (cleanBundle.length) params.set("bundleItems", cleanBundle.join(","));

      const res  = await fetch(`/api/marketplace/price-check?${params}`);
      const data = await res.json();
      if (data.result) {
        priceCache.set(cacheKey, { data: data.result, ts: Date.now() });
        setPriceResult(data.result);
      } else if (data.error) {
        setPriceError(data.error);
      }
    } catch {
      setPriceError("Could not connect. Try again.");
    } finally {
      setSearching(false);
    }
  }, [title, category, condition, brand, itemAge, images, listingType, bundleItems, priceCheckCount]);

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + uploadingCount + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed.`);
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    for (const file of files) {
      setUploadingCount((n) => n + 1);
      try {
        const form = new FormData();
        form.append("file", file);
        const res  = await fetch("/api/marketplace/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) toast.error(data.error ?? "Upload failed");
        else setImages((prev) => [...prev, data.url]);
      } catch { toast.error("Upload failed. Try again."); }
      finally  { setUploadingCount((n) => n - 1); }
    }
  }

  async function handleRemoveImage(url: string, index: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    try {
      await fetch("/api/marketplace/upload/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch { /* silent */ }
  }

  // ── Bank verify ───────────────────────────────────────────────────────────
  async function handleVerifyBank() {
    if (!accountNumber || !bankCode) return;
    setVerifying(true); setBankVerified(false); setAccountName("");
    try {
      const res  = await fetch("/api/marketplace/verify-bank", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setAccountName(data.accountName);
      setBankVerified(true);
      toast.success("Bank account verified ✓");
    } catch { toast.error("Verification failed. Try again."); }
    finally   { setVerifying(false); }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hasVerifiedPhone)   { setShowPhoneVerify(true); return; }
    if (!category)           { toast.error("Select a category.");      return; }
    if (!title.trim())       { toast.error("Enter the item name.");     return; }
    if (!description.trim()) { toast.error("Fill in the description."); return; }

    // Food skips condition and price check
    if (!isFood(category)) {
      if (!condition) { toast.error("Select the condition."); return; }
      if (listingType === "single" && !priceCheckAttempted) {
        toast.error("Check the market price first — this helps buyers trust your listing.");
        return;
      }
    }

    if (listingType === "bundle") {
      const cleanBundle = bundleItems.map((s) => s.trim()).filter(Boolean);
      if (cleanBundle.length < 2) { toast.error("Add at least 2 items for a bundle."); return; }
    }

    const numPrice = Number(price.replace(/,/g, ""));
    if (!numPrice || numPrice <= 0) { toast.error("Enter a valid price.");        return; }

    // Bulk pricing validation
    const numBulkPrice = bulkEnabled ? Number(bulkPrice.replace(/,/g, "")) : 0;
    if (bulkEnabled) {
      if (!numBulkPrice || numBulkPrice <= 0) { toast.error("Enter a valid bulk price."); return; }
      if (numBulkPrice >= numPrice) { toast.error("Bulk price must be lower than your single item price."); return; }
      if (bulkMinQty < 2) { toast.error("Minimum quantity for bulk must be at least 2."); return; }
    }
    if (!lga)                       { toast.error("Select your LGA.");             return; }
    if (!landmark.trim())           { toast.error("Enter the nearest landmark."); return; }
    if (!images.length)             { toast.error("Upload at least 1 photo.");    return; }
    if (!bankVerified)              { toast.error("Verify your bank account.");   return; }
    if (!agreed)                    { toast.error("Accept the seller agreement."); return; }

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setShowPermissionPrompt(true);
      return;
    }

    setSummaryPrice(numPrice);
    setShowSummary(true);
  }

  async function doSubmit(numPrice: number) {
    setSubmitting(true);
    try {
      const cleanBundleItems = bundleItems.map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/marketplace/listings/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType,
          title:       title.trim(),
          bulkMinQty:  bulkEnabled ? bulkMinQty  : null,
          bulkPrice:   bulkEnabled ? Math.round(Number(bulkPrice.replace(/,/g, "")) * 100) : null,
          category,
          condition:   isFood(category) ? null : condition,
          description: description.trim(),
          bundleItems: listingType === "bundle" ? cleanBundleItems : [],
          quantity:    isFood(category) ? quantity.trim() || null : null,
          price:       numPrice,
          state, lga,
          landmark:    landmark.trim(),
          images,
          hasReceipt:  isFood(category) ? false : hasReceipt,
          delivery,
          accountNumber, bankCode, accountName,
          sellerPriceNote: isFood(category) ? null : sellerPriceNote.trim() || null,
          refPriceMin:       isFood(category) ? null : priceResult?.newMin      ?? null,
          refPriceMax:       isFood(category) ? null : priceResult?.newMax      ?? null,
          refPriceSource:    isFood(category) ? null : priceResult?.priceSource ?? null,
          refPriceContext:   isFood(category) ? null : priceResult?.context     ?? null,
          refPriceGoogleUrl: isFood(category) ? null : priceResult?.googleUrl   ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not submit. Try again."); return; }
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Listing submitted — pending admin approval.");
      router.push("/marketplace?submitted=true");
    } catch { toast.error("Network error. Try again."); }
    finally   { setSubmitting(false); }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const categoryEmoji   = CATEGORIES.find((c) => c.value === category)?.emoji ?? "📦";
  const canCheckPrice   = title.trim().length >= 3 && !!category && !!condition && images.length > 0 && !isFood(category);
  const checksRemaining = MAX_PRICE_CHECKS - priceCheckCount;

  function PriceComparison() {
    const sellerPrice = Number(price.replace(/,/g, "")) || 0;
    const newAvg      = priceResult ? Math.round((priceResult.newMin + priceResult.newMax) / 2) : 0;
    const saving      = newAvg > 0 && sellerPrice > 0 ? newAvg - sellerPrice : 0;
    const savePct     = newAvg > 0 && sellerPrice > 0 ? Math.round((saving / newAvg) * 100) : 0;
    const overpriced  = sellerPrice > 0 && newAvg > 0 && sellerPrice >= newAvg;
    if (!sellerPrice || !newAvg) return null;
    return (
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", backgroundColor: overpriced ? "#FFF8E1" : "#F0FDF4" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Your listing price</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>₦{sellerPrice.toLocaleString("en-NG")}</span>
        </div>
        {!overpriced && saving > 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600 }}>Buyer saves vs buying new</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>₦{saving.toLocaleString("en-NG")} ({savePct}% off)</span>
          </div>
        ) : (
          <p style={{ fontSize: 11, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
            ⚠️ Your price is at or above the new price. Add a note below to explain the value.
          </p>
        )}
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--color-header)", margin: 0 }}>List an item</p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>Sold via escrow — you get paid after buyer confirms receipt</p>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── LISTING TYPE ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["single", "bundle"] as const).map((t) => (
              <button key={t} type="button" onClick={() => switchType(t)} style={{
                padding: "14px 10px", borderRadius: 14, textAlign: "center",
                border: listingType === t ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                backgroundColor: listingType === t ? "var(--color-light)" : "var(--color-bg)",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{t === "single" ? "📦" : "📦📦"}</span>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: listingType === t ? "var(--color-primary)" : "var(--color-text-secondary)", margin: "0 0 3px" }}>
                  {t === "single" ? "Single item" : "Bundle"}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.4 }}>
                  {t === "single" ? "One item for sale" : "Multiple items, one price"}
                </p>
              </button>
            ))}
          </div>

          {/* ── CATEGORY ── */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => handleCategoryChange(c.value)} style={{
                  padding: "11px 10px", borderRadius: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                  border: category === c.value ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                  backgroundColor: category === c.value ? "var(--color-light)" : "var(--color-bg)",
                  cursor: "pointer",
                }}>
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: category === c.value ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                    {c.value}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── FOOD FORM ── */}
          {isFood(category) && (
            <>
              {/* Food info banner */}
              <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "#F0FDF4", border: "1px solid #A5D6A7" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2E7D32", margin: "0 0 2px" }}>🍎 Listing a food item</p>
                <p style={{ fontSize: 12, color: "#388E3C", margin: 0, lineHeight: 1.5 }}>
                  Tell buyers what you are selling, how much you have, and your price. Keep it simple and honest.
                </p>
              </div>

              {/* Item name */}
              <div>
                <label style={labelStyle}>What are you selling?</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Crayfish, Fresh Tomatoes, Palm oil, Dried fish"
                  style={inputStyle} />
              </div>

              {/* Quantity */}
              <div>
                <label style={labelStyle}>
                  How much do you have? <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
                </label>
                <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5kg, 2 bags, 10 pieces, 1 crate"
                  style={inputStyle} />
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
                  Write whatever makes sense — buyers will ask if they need more details.
                </p>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder="Tell buyers more — where is it from? Is it fresh? Any extra details they should know?"
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
            </>
          )}

          {/* ── STANDARD FORM (non-food) ── */}
          {category && !isFood(category) && (
            <>
              {/* Condition */}
              <div>
                <label style={labelStyle}>Condition</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CONDITIONS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setCondition(c.value)} style={{
                      padding: "12px 14px", borderRadius: 12, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                      border: condition === c.value ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                      backgroundColor: condition === c.value ? "var(--color-light)" : "var(--color-bg)",
                      cursor: "pointer",
                    }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: condition === c.value ? "var(--color-primary)" : "var(--color-text)", margin: "0 0 2px" }}>{c.label}</p>
                        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{c.body}</p>
                      </div>
                      {condition === c.value && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
                          <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item name */}
              <div>
                <label style={labelStyle}>Item name</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={listingType === "bundle" ? "e.g. Room essentials bundle" : "e.g. Standing fan, iPhone 13, Mattress"}
                  style={inputStyle} />
              </div>

              {/* Brand + Age */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Brand <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Samsung" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Age <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
                  <input type="text" value={itemAge} onChange={(e) => setItemAge(e.target.value)}
                    placeholder="e.g. 6 months" style={inputStyle} />
                </div>
              </div>

              {/* Bundle items */}
              {listingType === "bundle" && (
                <div>
                  <label style={labelStyle}>Items in this bundle</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bundleItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="text" value={item} onChange={(e) => updateBundleItem(i, e.target.value)}
                          placeholder={`Item ${i + 1} e.g. Standing fan`} style={{ ...inputStyle, flex: 1 }} />
                        {bundleItems.length > 1 && (
                          <button type="button" onClick={() => removeBundleItem(i)}
                            style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {bundleItems.length < 15 && (
                      <button type="button" onClick={addBundleItem}
                        style={{ padding: "10px", borderRadius: 10, border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
                        + Add another item
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder={listingType === "bundle"
                    ? "Describe the overall condition. Mention any faults with specific items. Why are you selling?"
                    : "Any faults? How long have you used it? Why are you selling? Honest sellers sell faster."
                  }
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
            </>
          )}

          {/* ── PHOTOS — shown for all categories once category is selected ── */}
          {category && (
            <div>
              <label style={labelStyle}>
                Photos <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>({images.length}/{maxPhotos})</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {images.map((url, i) => (
                  <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => handleRemoveImage(url, i)}
                      style={{ position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <div key={`uploading-${i}`} style={{ aspectRatio: "1", borderRadius: 12, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  </div>
                ))}
                {images.length + uploadingCount < maxPhotos && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ aspectRatio: "1", borderRadius: 12, border: "1.5px dashed var(--color-border)", backgroundColor: "var(--color-bg)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600 }}>Add photo</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
                First photo is the cover. Max {maxPhotos} photos.
              </p>
            </div>
          )}

          {/* ── PRICE ── */}
          {category && (
            <div>
              <label style={labelStyle}>
                {isFood(category)
                  ? "Your price (₦)"
                  : listingType === "bundle" ? "Bundle price (₦)" : "Your price (₦)"
                }
              </label>
              <input type="text" inputMode="numeric" value={price}
                onChange={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); setPrice(d ? Number(d).toLocaleString("en-NG") : ""); }}
                placeholder={isFood(category) ? "e.g. 2,000" : "e.g. 8,000"}
                style={inputStyle}
              />

              {/* ── BULK PRICING — optional, all categories ── */}
              <div style={{ marginTop: 12 }}>
                <button type="button" onClick={() => { setBulkEnabled(v => !v); if (bulkEnabled) { setBulkPrice(""); setBulkMinQty(5); } }}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: bulkEnabled ? "var(--color-primary)" : "var(--color-border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: bulkEnabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                    Sell cheaper in larger quantities
                  </span>
                </button>

                {bulkEnabled && (
                  <div style={{ marginTop: 12, padding: "14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                      Set a lower price per item when a buyer orders a certain quantity or more.
                    </p>

                    {/* Minimum quantity */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...labelStyle, marginBottom: 8 }}>Minimum quantity for bulk price</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button type="button" onClick={() => setBulkMinQty(v => Math.max(2, v - 1))}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)", flexShrink: 0 }}>
                          −
                        </button>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", minWidth: 32, textAlign: "center" }}>
                          {bulkMinQty}
                        </span>
                        <button type="button" onClick={() => setBulkMinQty(v => v + 1)}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)", flexShrink: 0 }}>
                          +
                        </button>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>items minimum</span>
                      </div>
                    </div>

                    {/* Bulk price */}
                    <div>
                      <label style={labelStyle}>Bulk price per item (₦)</label>
                      <input type="text" inputMode="numeric" value={bulkPrice}
                        onChange={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); setBulkPrice(d ? Number(d).toLocaleString("en-NG") : ""); }}
                        placeholder="e.g. 4,500"
                        style={inputStyle}
                      />
                      {bulkPrice && price && (
                        <p style={{ fontSize: 11, color: "var(--color-primary)", margin: "6px 0 0", fontWeight: 600 }}>
                          Single: ₦{price} · Bulk ({bulkMinQty}+): ₦{bulkPrice} per item
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI price check — non-food only */}
              {!isFood(category) && (
                <div style={{ marginTop: 10 }}>
                  {!canCheckPrice && (
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                      Add item name, category, condition and a photo to enable the market price guide.
                    </p>
                  )}
                  {canCheckPrice && checksRemaining > 0 && !searching && (
                    <button type="button" onClick={searchPrice} style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${priceCheckAttempted ? "var(--color-border)" : "var(--color-primary)"}`,
                      backgroundColor: priceCheckAttempted ? "var(--color-bg)" : "var(--color-light)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: priceCheckAttempted ? "var(--color-text-secondary)" : "var(--color-primary)" }}>
                        ✨ {priceCheckAttempted ? "Check price again" : "Get market price reference — helps you price wisely"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--color-text-muted)", flexShrink: 0 }}>{checksRemaining} left</span>
                    </button>
                  )}
                  {searching && (
                    <div style={{ padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Checking Nigerian market prices…</p>
                    </div>
                  )}
                  {!searching && priceResult && (
                    <div style={{ borderRadius: 12, border: "1.5px solid var(--color-primary)", overflow: "hidden" }}>
                      <div style={{ padding: "8px 14px", backgroundColor: "var(--color-light)", borderBottom: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                          📊 Live prices from Nigerian stores · {priceResult.priceSource}
                        </p>
                      </div>
                      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Buying new in Nigeria</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                          ₦{priceResult.newMin.toLocaleString()} – ₦{priceResult.newMax.toLocaleString()}
                        </span>
                      </div>
                      {priceResult.usedMin != null && priceResult.usedMax != null && (
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Similar used listings</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                            ₦{priceResult.usedMin.toLocaleString()} – ₦{priceResult.usedMax.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <PriceComparison />
                      <div style={{ padding: "10px 14px", backgroundColor: "var(--color-light)" }}>
                        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>💡 {priceResult.context}</p>
                        <a href={priceResult.googleUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                          See more current prices on Google →
                        </a>
                      </div>
                    </div>
                  )}
                  {!searching && priceError && !priceResult && (
                    <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 6px" }}>No price reference found</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                        Search Google manually and set a fair price:
                      </p>
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(`${title} ${brand} price Nigeria`)}`}
                        target="_blank" rel="noopener noreferrer" onClick={() => setPriceCheckAttempted(true)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, textDecoration: "none", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>Search on Google →</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    </div>
                  )}
                  {priceCheckAttempted && !searching && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 5, display: "block" }}>
                        Explain your price <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
                      </label>
                      <textarea value={sellerPriceNote} onChange={(e) => setSellerPriceNote(e.target.value.slice(0, 200))} rows={2}
                        placeholder="e.g. Includes original box and Apple Pencil — never repaired, bought 3 months ago"
                        style={{ ...inputStyle, resize: "none", fontSize: 12 }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{sellerPriceNote.length}/200</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LOCATION — shown for all categories ── */}
          {category && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>State</label>
                <select value={state} onChange={(e) => { setState(e.target.value); setLga(""); }} style={inputStyle}>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>LGA</label>
                <select value={lga} onChange={(e) => setLga(e.target.value)} style={inputStyle}>
                  <option value="">Select LGA</option>
                  {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nearest landmark</label>
                <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near NYSC secretariat, Behind Eket market"
                  style={inputStyle} />
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
                  Helps buyers know where to meet. Exact address shared only after payment.
                </p>
              </div>
            </div>
          )}

          {/* ── BANK ACCOUNT — shown for all categories ── */}
          {category && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelStyle}>Bank</label>
                <div style={{ position: "relative" }}>
                  <input type="text" value={bankSearch}
                    onChange={(e) => { setBankSearch(e.target.value); setBankDropdownOpen(true); if (bankCode) { setBankCode(""); setBankVerified(false); setAccountName(""); } }}
                    onFocus={() => setBankDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setBankDropdownOpen(false), 150)}
                    placeholder={banks.length ? "Search your bank…" : "Loading banks…"}
                    style={inputStyle} autoComplete="off"
                  />
                  {bankCode && !bankDropdownOpen && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {bankDropdownOpen && banks.length > 0 && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, maxHeight: 220, overflowY: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
                      {banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())).length === 0
                        ? <p style={{ padding: "12px 14px", fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No bank found</p>
                        : banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())).map((b, i, arr) => (
                            <button key={b.code} type="button"
                              onMouseDown={() => { setBankCode(b.code); setBankSearch(b.name); setBankDropdownOpen(false); if (b.code !== bankCode) { setBankVerified(false); setAccountName(""); } }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", fontSize: 13, cursor: "pointer", color: bankCode === b.code ? "var(--color-primary)" : "var(--color-text)", backgroundColor: bankCode === b.code ? "var(--color-light)" : "transparent", border: "none", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none", fontWeight: bankCode === b.code ? 600 : 400 }}>
                              {b.name}
                            </button>
                          ))
                      }
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Account number</label>
                <input type="text" inputMode="numeric" value={accountNumber}
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 10); setAccountNumber(d); if (d.length < 10) { setBankVerified(false); setAccountName(""); } }}
                  placeholder="10-digit account number" maxLength={10} style={inputStyle}
                />
              </div>
              {verifying && (
                <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Verifying account…</p>
                </div>
              )}
              {bankVerified && (
                <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "#E8F5E9", border: "1.5px solid #A5D6A7", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#2E7D32" />
                    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p style={{ fontSize: 11, color: "#2E7D32", fontWeight: 600, margin: "0 0 2px" }}>Account verified</p>
                    <p style={{ fontSize: 14, color: "#0D1F0D", fontWeight: 700, margin: 0 }}>{accountName}</p>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                Your payout goes here after buyer confirms receipt. CorperNest keeps 5%.
              </p>
            </div>
          )}

          {/* ── RECEIPT — non-food only ── */}
          {category && !isFood(category) && (
            <div style={{ padding: "14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: "0 0 10px" }}>Proof of purchase</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ val: true, label: "📄 Yes, I have receipt" }, { val: false, label: "🚫 No receipt" }].map(({ val, label }) => (
                  <button key={String(val)} type="button" onClick={() => setHasReceipt(val)} style={{
                    flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1.5px solid",
                    borderColor: hasReceipt === val ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: hasReceipt === val ? "var(--color-light)" : "var(--color-bg)",
                    color: hasReceipt === val ? "var(--color-primary)" : "var(--color-text-muted)", cursor: "pointer",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              {hasReceipt && (
                <p style={{ fontSize: 11, color: "var(--color-primary)", margin: "8px 0 0" }}>
                  ✓ Items with receipts attract more buyers and sell faster.
                </p>
              )}
            </div>
          )}

          {/* ── DELIVERY — shown for all categories ── */}
          {category && (
            <div>
              <label style={labelStyle}>How can buyers get this item?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { val: "pickup",   label: "📍 Pickup only",          body: "Buyer comes to you"                  },
                  { val: "delivery", label: "🚚 Delivery available",   body: "You can deliver within your area"    },
                  { val: "both",     label: "📍🚚 Pickup or delivery", body: "Buyer decides"                       },
                ].map((d) => (
                  <button key={d.val} type="button" onClick={() => setDelivery(d.val as typeof delivery)} style={{
                    padding: "11px 14px", borderRadius: 12, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: delivery === d.val ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                    backgroundColor: delivery === d.val ? "var(--color-light)" : "var(--color-bg)",
                    cursor: "pointer",
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: delivery === d.val ? "var(--color-primary)" : "var(--color-text)", margin: "0 0 2px" }}>{d.label}</p>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{d.body}</p>
                    </div>
                    {delivery === d.val && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
                        <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SELLER AGREEMENT — shown once category is selected ── */}
          {category && (
            <div style={{ padding: "14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px" }}>
                Seller Agreement
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  "The item I am listing exists and is in my possession.",
                  "The photos I uploaded are of the actual item — not downloaded from the internet.",
                  "I will confirm availability promptly when a buyer requests to purchase.",
                  "I will make the item available for handover after payment is confirmed.",
                  "CorperNest will hold 5% commission from every sale.",
                  "I confirm this item is not stolen, counterfeit, or fraudulently obtained. Listing stolen property is a criminal offence under Nigerian law.",
                  "If I list a stolen item, commit fraud, or collect payment and fail to deliver, CorperNest will report the full transaction — including my bank details, identity, and records — to the Nigeria Police Force and the EFCC for prosecution.",
                ].map((point, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-primary)", flexShrink: 0, marginTop: 6 }} />
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.55 }}>{point}</p>
                  </div>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "var(--color-primary)", cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                  I agree to the seller terms above
                </span>
              </label>
            </div>
          )}

          {/* ── SUBMIT ── */}
          {category && (
            <>
              <button type="submit" disabled={submitting || !agreed}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", backgroundColor: (!agreed || submitting) ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: (!agreed || submitting) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {submitting
                  ? <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  : "Review & Submit Listing →"}
              </button>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", margin: 0 }}>
                Your listing goes to admin for review before going live.
              </p>
            </>
          )}

        </form>
      </div>

      {/* ── SUMMARY MODAL ── */}
      {showSummary && (
        <ListingSummaryModal
          title={title}
          category={category}
          categoryEmoji={categoryEmoji}
          condition={isFood(category) ? "" : condition}
          listingType={listingType}
          bundleItems={bundleItems}
          images={images}
          delivery={delivery}
          price={summaryPrice}
          accountName={accountName}
          bankName={bankSearch}
          accountNumber={accountNumber}
          hasReceipt={isFood(category) ? false : hasReceipt}
          submitting={submitting}
          onConfirm={() => { setShowSummary(false); doSubmit(summaryPrice); }}
          onBack={() => setShowSummary(false)}
        />
      )}

      {/* ── PHONE VERIFICATION ── */}
      {showPhoneVerify && (
        <PhoneVerificationModal
          onClose={() => setShowPhoneVerify(false)}
          onVerified={() => {
            setShowPhoneVerify(false);
            toast.success("Phone verified — you can now submit your listing.");
          }}
        />
      )}

      {/* ── NOTIFICATION PERMISSION ── */}
      {showPermissionPrompt && (
        <NotificationPermissionPrompt
          context="sell"
          onGranted={() => {
            setShowPermissionPrompt(false);
            setSummaryPrice(Number(price.replace(/,/g, "")));
            setShowSummary(true);
          }}
          onSkip={() => {
            setShowPermissionPrompt(false);
            setSummaryPrice(Number(price.replace(/,/g, "")));
            setShowSummary(true);
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}