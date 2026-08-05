// src/app/(market)/marketplace/[id]/listing-client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import MarketplacePriceIntelligence from "@/components/marketplace/price-intelligence";
import PhoneVerificationModal from "@/components/phone-verification-modal";
import NotificationPermissionPrompt from "@/components/notification-permission-prompt";

// ── TYPES ─────────────────────────────────────────────────────────────────────

type Listing = {
  id:               string;
  listingType:      string;
  title:            string;
  category:         string;
  condition:        string;
  description:      string;
  bundleItems:      string[];
  price:            number;
  state:            string;
  lga:              string;
  landmark:         string;
  images:           string[];
  hasReceipt:       boolean | null;
  sellerPriceNote:  string | null;
  refPriceMin:      number | null;
  refPriceMax:      number | null;
  refPriceSource:   string | null;
  refPriceContext:  string | null;
  refPriceGoogleUrl: string | null;
  bulkMinQty:        number | null;
  bulkPrice:         number | null;
  status:           string;
  createdAt:        Date | string;
  sellerId:         string;
};

type Seller = {
  id:             string;
  name:           string;
  verified:       boolean;
  completedSales: number;
};

type SimilarListing = {
  id:        string;
  title:     string;
  price:     number;
  images:    string[];
  condition: string;
  lga:       string;
};

type Props = {
  listing:          Listing;
  seller:           Seller;
  similar:          SimilarListing[];
  currentUserId:    string | null;
  isOwnListing:     boolean;
  hasVerifiedPhone: boolean;
  initialOffer:     Offer | null;
};

type Offer = {
  id:           string;
  latestAmount: number;
  listedPrice:  number;
  counterCount: number;
  status:       string;
  history:      { amount: number; fromRole: string; createdAt: string }[];
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<string, string> = {
  "new":         "✨ New",
  "fairly-used": "♻️ Fairly Used",
  "mixed":       "🔀 Mixed condition",
};

const DELIVERY_LABEL: Record<string, string> = {
  "pickup":   "📍 Pickup only",
  "delivery": "🚚 Delivery available",
  "both":     "📍🚚 Pickup or delivery",
};

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function Spinner({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
  );
}

// ── ZOOM VIEWER ───────────────────────────────────────────────────────────────

function ZoomViewer({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const lastTapRef        = useRef(0);

  function next(e?: React.MouseEvent) { e?.stopPropagation(); setScale(1); setIndex((p) => (p + 1) % images.length); }
  function prev(e?: React.MouseEvent) { e?.stopPropagation(); setScale(1); setIndex((p) => (p - 1 + images.length) % images.length); }

  function handleTap(e: React.MouseEvent) {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) setScale((s) => s === 1 ? 2.2 : 1);
    lastTapRef.current = now;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }} onClick={onClose}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20 }}>
          {index + 1} / {images.length}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        <img src={images[index]} alt={`Photo ${index + 1}`} onClick={handleTap}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: `scale(${scale})`, transition: "transform 0.25s ease", cursor: scale === 1 ? "zoom-in" : "zoom-out" }} />
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={next} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>
      <div style={{ flexShrink: 0, padding: "8px 16px 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>Double-tap to zoom</p>
        {images.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", justifyContent: "center" }}>
            {images.map((img, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setScale(1); setIndex(i); }}
                style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: i === index ? "2px solid #fff" : "2px solid rgba(255,255,255,0.25)", cursor: "pointer", padding: 0 }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function ListingClient({ listing, seller, similar, currentUserId, isOwnListing, hasVerifiedPhone, initialOffer }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [photoIndex,             setPhotoIndex]             = useState(0);
  const [zoomOpen,               setZoomOpen]               = useState(false);
  const [saved,                  setSaved]                  = useState(false);
  const [savingItem,             setSavingItem]             = useState(false);
  const [showBuyModal,           setShowBuyModal]           = useState(false);
  const [showPhoneVerify,        setShowPhoneVerify]        = useState(false);
  const [showPermissionPrompt,   setShowPermissionPrompt]   = useState(false);
  const [buyLoading,             setBuyLoading]             = useState(false);
  const [availRequest,           setAvailRequest]           = useState<{
    id: string; status: string; minutesRemaining: number;
    checkoutMinutesRemaining: number | null; adminEscalated: boolean;
    expiresAtMs: number; checkoutExpiresAtMs: number | null;
  } | null>(null);
  const [submittingAvailability, setSubmittingAvailability] = useState(false);
  const [countdown,              setCountdown]              = useState("45:00");
  // showOfferModal initialized with initialOffer below
  const [offerAmount,            setOfferAmount]            = useState("");
  const [submittingOffer,        setSubmittingOffer]        = useState(false);
  const [offer, setOffer] = useState<Offer | null>(initialOffer);
  // Auto-open offer modal if there is an offer needing THIS user's response
  // Check last history entry — don't open for the person who just acted
  const lastHistoryRole = initialOffer?.history?.[initialOffer.history.length - 1]?.fromRole;
  const [showOfferModal, setShowOfferModal] = useState(
    !!initialOffer && (
      // Seller should respond — buyer was last to act
      (isOwnListing && lastHistoryRole !== "seller" && ["pending", "countered"].includes(initialOffer.status)) ||
      // Buyer should respond — seller was last to act
      (!isOwnListing && lastHistoryRole !== "buyer" && initialOffer.status === "countered")
    )
  );

  const images     = listing.images.length > 0 ? listing.images : [];
  // Use live client session — more reliable than server prop for triggering effects
  // Server prop (currentUserId) can be null if session was slow; client hook is always current
  const { data: clientSession } = authClient.useSession();
  const isLoggedIn = !!(clientSession?.user?.id ?? currentUserId);

  // Fetch offer on login — only if not already pre-fetched server-side
  useEffect(() => {
    if (!isLoggedIn) return;
    if (searchParams.get("buy") === "1" && listing.status === "active" && !isOwnListing) {
      setShowBuyModal(true);
    }
    if (initialOffer) return; // already pre-fetched server-side
    fetch(`/api/marketplace/offers?listingId=${listing.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.offer) return;
        setOffer(d.offer);
        // Last history entry tells us who just acted — don't re-open for them
        const history = d.offer.history ?? [];
        const lastRole = history[history.length - 1]?.fromRole;
        const sellerJustActed = lastRole === "seller";
        const buyerJustActed  = lastRole === "buyer";
        // Open for seller if buyer last acted (buyer's offer/counter waiting for seller)
        if (isOwnListing && !sellerJustActed && ["pending", "countered"].includes(d.offer.status)) {
          setShowOfferModal(true);
        }
        // Open for buyer if seller last acted (seller's counter waiting for buyer)
        if (!isOwnListing && !buyerJustActed && d.offer.status === "countered") {
          setShowOfferModal(true);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Poll for offer status changes when waiting for other party's response
  // This auto-opens the modal when the other party counters while user is already on the page
  useEffect(() => {
    if (!isLoggedIn || !offer) return;
    if (!["pending", "countered"].includes(offer.status)) return;

    // Check if it is currently our turn — if yes, modal should already be open
    const lastRole = offer.history?.[offer.history.length - 1]?.fromRole;
    const isMyTurn = (isOwnListing && lastRole === "buyer") || (!isOwnListing && lastRole === "seller");
    if (isMyTurn) return; // Already our turn — no need to poll

    // Poll every 20 seconds waiting for other party to respond
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/marketplace/offers?listingId=${listing.id}`);
        const d = await r.json();
        if (!d.offer) return;

        const newLastRole = d.offer.history?.[d.offer.history.length - 1]?.fromRole;
        setOffer(d.offer);

        // Open modal when it becomes our turn
        if (isOwnListing && newLastRole === "buyer" && ["pending", "countered"].includes(d.offer.status)) {
          setShowOfferModal(true);
          clearInterval(poll);
        }
        if (!isOwnListing && newLastRole === "seller" && d.offer.status === "countered") {
          setShowOfferModal(true);
          clearInterval(poll);
        }

        // Stop polling if offer is closed
        if (["accepted", "declined", "expired"].includes(d.offer.status)) {
          clearInterval(poll);
        }
      } catch { /* silent */ }
    }, 20_000);

    return () => clearInterval(poll);
  }, [offer?.id, offer?.status, offer?.counterCount]);
  useEffect(() => {
    if (!availRequest || availRequest.status !== "pending") return;

    const tickTimer = setInterval(() => {
      const remaining = Math.max(0, availRequest.expiresAtMs - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

      // When countdown hits zero — trigger lazy expiry server-side then refresh
      if (remaining === 0) {
        clearInterval(tickTimer);
        fetch(`/api/marketplace/availability?listingId=${listing.id}`)
          .then(() => router.refresh()) // server reverts listing to active
          .catch(() => router.refresh());
      }
    }, 1000);

    const pollTimer = setInterval(async () => {
      try {
        const res  = await fetch(`/api/marketplace/availability?listingId=${listing.id}`);
        const data = await res.json();
        if (!data.request) return;
        if (data.request.status === "confirmed") {
          setAvailRequest(data.request);
          clearInterval(pollTimer);
          clearInterval(tickTimer);
          toast.success("✅ Item confirmed! Tap below to complete your payment.", { duration: 6000 });
        } else if (["expired", "denied", "cancelled"].includes(data.request.status)) {
          setAvailRequest(data.request);
          clearInterval(pollTimer);
          clearInterval(tickTimer);
          router.refresh();
        }
      } catch { /* silent */ }
    }, 30_000);

    return () => { clearInterval(tickTimer); clearInterval(pollTimer); };
  }, [availRequest?.id, availRequest?.status]);

  // ── Share ─────────────────────────────────────────────────────────────────
  function handleShare() {
    const url       = window.location.href;
    const priceStr  = `₦${listing.price.toLocaleString("en-NG")}`;
    const condLabel = listing.condition === "new" ? "✨ New" : listing.condition === "fairly-used" ? "♻️ Fairly Used" : "🔀 Mixed";
    const receipt   = listing.hasReceipt ? "\n📄 Receipt available" : "";

    // Only show reference price if listed price is genuinely below new price
    const isBelowNew = listing.refPriceMin && listing.price < listing.refPriceMin;
    const savePct    = isBelowNew && listing.refPriceMin
      ? Math.round(((listing.refPriceMin - listing.price) / listing.refPriceMin) * 100)
      : 0;
    const refLine   = isBelowNew && listing.refPriceMin && listing.refPriceMax
      ? `\n🏷️ New price: ₦${listing.refPriceMin.toLocaleString("en-NG")} – ₦${listing.refPriceMax.toLocaleString("en-NG")}`
      : "";
    const saveLine  = isBelowNew && savePct > 0
      ? `\n💸 Save ${savePct}% vs buying new!`
      : "";

    const text =
      `${listing.title}\n\n` +
      `💰 Price: ${priceStr}${refLine}${saveLine}\n` +
      `📦 ${condLabel} · ${listing.category}\n` +
      `📍 ${listing.lga}, ${listing.state}${receipt}\n` +
      `🔒 Buy safely via Escrow on CorperNest\n\n` +
      `👉 ${url}\n\n` +
      `📲 Community: chat.whatsapp.com/GqaBzJjdPdlDMwjvaGQQeJ\n` +
      `Follow us on X: @_Corpernest`;

    if (navigator.share) {
      navigator.share({ title: listing.title, text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!isLoggedIn) { router.push("/signin?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    setSavingItem(true);
    try {
      const res  = await fetch("/api/marketplace/listings/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: listing.id }) });
      const data = await res.json();
      if (res.ok) { setSaved(data.saved); toast(data.saved ? "Saved to bookmarks" : "Removed from bookmarks"); }
    } catch { toast.error("Could not save. Try again."); }
    finally { setSavingItem(false); }
  }

  // Quantity selector — used when seller has set bulk pricing
  const [qty, setQty] = useState(1);

  // If buyer selected qty >= bulkMinQty, use bulk price per item
  const unitPrice  = listing.bulkMinQty && listing.bulkPrice && qty >= listing.bulkMinQty
    ? listing.bulkPrice
    : listing.price;
  const totalPrice = unitPrice * qty;
  const hasBulk    = !!(listing.bulkMinQty && listing.bulkPrice);

  // ── Buy ───────────────────────────────────────────────────────────────────
  function handleBuy() {
    if (!isLoggedIn) { router.push("/signin?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    if (isOwnListing) { toast.error("You cannot buy your own listing."); return; }
    if (!hasVerifiedPhone) { setShowPhoneVerify(true); return; }
    // Show permission prompt if not yet granted — buyer needs push to know when seller confirms
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setShowPermissionPrompt(true);
      return;
    }
    proceedToBuy();
  }

  function proceedToBuy() {
    setBuyLoading(true);
    fetch(`/api/marketplace/availability?listingId=${listing.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.request) setAvailRequest(d.request); })
      .catch(() => {})
      .finally(() => { setBuyLoading(false); setShowBuyModal(true); });
  }

  async function handleConfirmAvailability() {
    setSubmittingAvailability(true);
    try {
      const res  = await fetch("/api/marketplace/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: listing.id, quantity: qty, agreedPrice: Math.round(totalPrice * 100) }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not send request. Try again."); return; }
      setAvailRequest(data.request);
      toast("Availability request sent — we'll notify you when confirmed.");
    } catch { toast.error("Network error. Try again."); }
    finally   { setSubmittingAvailability(false); }
  }

  // ── Offer ─────────────────────────────────────────────────────────────────
  function handleOfferClick() {
    if (!isLoggedIn) { router.push("/signin?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    if (isOwnListing) { toast.error("You cannot make an offer on your own listing."); return; }
    setOfferAmount(listing.price.toString());
    setShowOfferModal(true);
  }

  async function submitOffer(action: string, amount?: number) {
    setSubmittingOffer(true);
    try {
      const body: Record<string, unknown> = { action, listingId: listing.id };
      if (offer?.id) body.offerId = offer.id;
      if (amount)    body.amount  = amount;
      const res  = await fetch("/api/marketplace/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not process. Try again."); return; }

      if (action === "make") {
        toast.success("Offer sent — seller will respond within 2 hours.");
        setShowOfferModal(false);
        const r = await fetch(`/api/marketplace/offers?listingId=${listing.id}`);
        const d = await r.json();
        if (d.offer) setOffer(d.offer);

      } else if (action === "accept") {
        // Both buyer and seller now use "accept" — triggers availability flow
        toast.success("🎉 Offer accepted! Notifying seller to confirm availability…");
        setShowOfferModal(false);
        await proceedToBuyWithOffer(offer?.id);

      } else if (action === "decline") {
        toast("Offer declined.");
        setShowOfferModal(false);
        setOffer((prev) => prev ? { ...prev, status: "declined" } : null);

      } else if (action === "counter") {
        toast.success("Counter-offer sent — waiting for their response.");
        setShowOfferModal(false);
        const r = await fetch(`/api/marketplace/offers?listingId=${listing.id}`);
        const d = await r.json();
        if (d.offer) setOffer(d.offer);
      }
    } catch { toast.error("Network error. Try again."); }
    finally { setSubmittingOffer(false); }
  }

  // After offer accepted — trigger availability at agreed offer price
  async function proceedToBuyWithOffer(offerId?: string) {
    if (!offerId) { router.push(`/marketplace/${listing.id}`); return; }
    setBuyLoading(true);
    try {
      const res  = await fetch("/api/marketplace/availability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, offerId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not confirm. Try again."); return; }
      setAvailRequest(data.request);
      setShowBuyModal(true);
    } catch { toast.error("Network error. Try again."); }
    finally   { setBuyLoading(false); }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  function handleReport() {
    if (!isLoggedIn) { router.push("/signin?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    router.push(`/marketplace/${listing.id}/report`);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg)", paddingBottom: 100 }}>

      {/* Photo gallery */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", backgroundColor: "#111", overflow: "hidden", cursor: "zoom-in" }}>
        {images.length > 0 ? (
          <>
            <img src={images[photoIndex]} alt={listing.title}
              onClick={() => setZoomOpen(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {images.length > 1 && (
              <>
                {photoIndex > 0 && (
                  <button onClick={() => setPhotoIndex((i) => i - 1)}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
                {photoIndex < images.length - 1 && (
                  <button onClick={() => setPhotoIndex((i) => i + 1)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
                <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      style={{ width: i === photoIndex ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === photoIndex ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s" }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-card)" }}>
            <span style={{ fontSize: 64 }}>📦</span>
          </div>
        )}

        {/* Back + share + save */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)" }}>
          <button onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={savingItem}
              style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "white" : "none"}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={handleShare}
              style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="1.8" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="white" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 0" }}>

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {listing.status !== "active" && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "#FEF2F2", color: "#C62828", border: "1px solid #FECACA" }}>
              {listing.status === "reserved" ? "Reserved" : listing.status === "sold" ? "Sold" : listing.status}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: "var(--color-light)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            {listing.listingType === "bundle" ? "📦 Bundle" : "Single item"}
          </span>
          {listing.hasReceipt && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#2E7D32", border: "1px solid #A5D6A7" }}>
              📄 Receipt
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, color: "var(--color-header)", margin: "0 0 4px", lineHeight: 1.3 }}>
          {listing.title}
        </h1>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          {listing.category} · {CONDITION_LABEL[listing.condition] ?? listing.condition} · {timeAgo(listing.createdAt)}
        </p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, color: "var(--color-primary)", margin: "0 0 16px" }}>
          ₦{listing.price.toLocaleString("en-NG")}
        </p>

        {/* Bulk pricing info */}
        {hasBulk && (
          <div style={{ marginTop: 6 }}>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
              ₦{listing.bulkPrice!.toLocaleString("en-NG")} each · buy {listing.bulkMinQty}+ items
            </p>
          </div>
        )}

        {/* Quantity selector — only shown when bulk pricing exists */}
        {hasBulk && listing.status === "active" && !isOwnListing && (
          <div style={{ marginTop: 14, padding: "14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>Quantity</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <button type="button" onClick={() => setQty(v => Math.max(1, v - 1))}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)" }}>
                −
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", minWidth: 28, textAlign: "center" }}>{qty}</span>
              <button type="button" onClick={() => setQty(v => v + 1)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text)" }}>
                +
              </button>
              {qty >= (listing.bulkMinQty ?? 0) && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D" }}>
                  Bulk price applied ✓
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {qty > 1 ? `₦${unitPrice.toLocaleString("en-NG")} × ${qty}` : "Single item price"}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
                ₦{totalPrice.toLocaleString("en-NG")}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isOwnListing && (
          <div style={{ marginBottom: 20 }}>
            {listing.status === "active" ? (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <button onClick={handleBuy} disabled={buyLoading}
                    style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", backgroundColor: buyLoading ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: buyLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {buyLoading ? <Spinner /> : "🔒 Buy via Escrow"}
                  </button>
                  {(!offer || ["declined", "expired"].includes(offer.status)) && (
                    <button onClick={handleOfferClick}
                      style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      💬 Offer
                    </button>
                  )}
                </div>

                {offer && !["declined", "expired"].includes(offer.status) && (
                  <div style={{ padding: "12px 14px", borderRadius: 14, border: "1.5px solid var(--color-primary)", backgroundColor: "var(--color-light)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>💬 Your offer</p>
                    {offer.history.map((h, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < offer.history.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{h.fromRole === "buyer" ? "Your offer" : "Seller counter"}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>₦{h.amount.toLocaleString("en-NG")}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
                      {offer.status === "pending" && <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>Waiting for seller to respond…</p>}
                      {offer.status === "countered" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => submitOffer("accept")} disabled={submittingOffer}
                            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {submittingOffer ? <Spinner size={12} /> : `Accept ₦${offer.latestAmount.toLocaleString()}`}
                          </button>
                          <button onClick={() => submitOffer("decline")} disabled={submittingOffer}
                            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Decline
                          </button>
                        </div>
                      )}
                      {offer.status === "accepted" && (
                        <button onClick={() => router.push(`/marketplace/${listing.id}/checkout?offer=${offer.id}`)}
                          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", backgroundColor: "#15803D", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          🎉 Pay agreed price ₦{offer.latestAmount.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : listing.status === "reserved" ? (
              <button disabled style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "#FFF8E1", color: "#92400E", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
                ⏳ Payment in Escrow
              </button>
            ) : listing.status === "sold" ? (
              <button disabled style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
                ✓ Sold Out
              </button>
            ) : null}
          </div>
        )}

        {isOwnListing && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: "#4338CA", margin: 0, fontWeight: 600 }}>This is your listing — buyers see this page when they tap your item.</p>
            </div>
            {listing.status === "pending" && (
              <button disabled style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", backgroundColor: "var(--color-border)", color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
                ⏳ Awaiting Admin Approval
              </button>
            )}
          </div>
        )}

        <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "4px 0 20px" }} />

        <MarketplacePriceIntelligence
          listingPrice={listing.price}
          refPriceMin={listing.refPriceMin}
          refPriceMax={listing.refPriceMax}
          refPriceSource={listing.refPriceSource}
          refPriceContext={listing.refPriceContext}
          refPriceGoogleUrl={listing.refPriceGoogleUrl}
          sellerPriceNote={listing.sellerPriceNote}
        />

        <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "20px 0" }} />

        {/* Seller card */}
        <div style={{ padding: "14px", borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "var(--color-primary)" }}>
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{seller.name}</p>
                  {seller.verified && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D", border: "1px solid #A5D6A7" }}>✓ Verified</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                  {seller.completedSales > 0 ? `${seller.completedSales} completed sale${seller.completedSales > 1 ? "s" : ""}` : "New seller"} · Bank verified
                </p>
              </div>
            </div>
            <button onClick={() => router.push(`/marketplace/store/${seller.id}`)}
              style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", background: "none", border: "1px solid var(--color-primary)", borderRadius: 10, padding: "6px 12px", cursor: "pointer" }}>
              View store
            </button>
          </div>
        </div>

        {/* Item details */}
        <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px", margin: 0, borderBottom: "1px solid var(--color-border)" }}>
            Item details
          </p>
          {([
            { label: "Category",  value: listing.category },
            { label: "Condition", value: CONDITION_LABEL[listing.condition] ?? listing.condition },
            { label: "Location",  value: `${listing.lga}, ${listing.state}` },
            { label: "Pickup",    value: listing.landmark },
            { label: "Delivery",  value: (listing as Listing & { delivery?: string }).delivery ? DELIVERY_LABEL[(listing as Listing & { delivery?: string }).delivery!] ?? "📍 Pickup only" : "📍 Pickup only" },
            { label: "Type",      value: listing.listingType === "bundle" ? "Bundle / Set" : "Single item" },
          ]).map(({ label, value }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)", minWidth: 80 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", textAlign: "right", flex: 1, marginLeft: 12 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Bundle items */}
        {listing.listingType === "bundle" && listing.bundleItems.length > 0 && (
          <div style={{ borderRadius: 14, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", overflow: "hidden", marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px", margin: 0, borderBottom: "1px solid var(--color-border)" }}>
              Items in this bundle ({listing.bundleItems.length})
            </p>
            <div style={{ padding: "8px 14px" }}>
              {listing.bundleItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < listing.bundleItems.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>•</span>
                  <span style={{ fontSize: 13, color: "var(--color-text)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Description</p>
          <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{listing.description}</p>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Similar listings</p>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "0 -16px", padding: "0 16px", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
              {similar.map((item) => (
                <button key={item.id} onClick={() => router.push(`/marketplace/${item.id}`)}
                  style={{ flexShrink: 0, width: 140, textAlign: "left", background: "none", border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", padding: 0 }}>
                  <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--color-light)", overflow: "hidden" }}>
                    {item.images[0]
                      ? <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                    }
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>₦{item.price.toLocaleString("en-NG")}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isOwnListing && (
          <button onClick={handleReport}
            style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: 12, color: "var(--color-text-muted)", cursor: "pointer" }}>
            🚩 Report this listing
          </button>
        )}
      </div>

      {/* Offer modal */}
      {showOfferModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowOfferModal(false); }}>
          <div style={{ backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", maxHeight: "80dvh", display: "flex", flexDirection: "column" }}>

            {/* Drag handle */}
            <div style={{ flexShrink: 0, padding: "16px 16px 0", textAlign: "center" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto" }} />
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>

              {/* Title + history — same for all views */}
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 4px" }}>
                {!offer || ["declined", "expired"].includes(offer.status)
                  ? "Make an Offer"
                  : isOwnListing
                    ? offer.status === "pending" ? "Buyer made an offer" : "Buyer countered"
                    : "Seller counter-offer"
                }
              </h2>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
                Listed at ₦{listing.price.toLocaleString("en-NG")}
              </p>

              {/* Offer history */}
              {offer && !["declined", "expired"].includes(offer.status) && offer.history?.length > 0 && (
                <div style={{ borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 14, overflow: "hidden" }}>
                  {offer.history.map((h: { fromRole: string; amount: number }, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < offer.history.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {h.fromRole === "buyer" ? (isOwnListing ? "Buyer offered" : "Your offer") : (isOwnListing ? "Your counter" : "Seller counter")}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
                        ₦{h.amount.toLocaleString("en-NG")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price input — initial offer OR counter */}
              {(!offer || ["declined", "expired"].includes(offer.status) || (offer.counterCount < 2 && ["pending", "countered"].includes(offer.status))) && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                    {!offer || ["declined", "expired"].includes(offer.status)
                      ? "Your offer (₦)"
                      : `Counter offer (₦) — ${2 - offer.counterCount} attempt${2 - offer.counterCount === 1 ? "" : "s"} left`
                    }
                  </label>
                  <input type="text" inputMode="numeric" value={offerAmount}
                    onChange={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); setOfferAmount(d ? Number(d).toLocaleString("en-NG") : ""); }}
                    placeholder="e.g. 12,000"
                    style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid var(--color-primary)", fontSize: 16, fontWeight: 700, color: "var(--color-text)", backgroundColor: "var(--color-bg)", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              )}

              <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                🔒 No contact details shared until payment confirmed. Each side gets 2 counter attempts.
              </p>
            </div>

            {/* Action buttons — always at bottom, never scrolls away */}
            <div style={{ flexShrink: 0, padding: "12px 16px 32px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8, backgroundColor: "var(--color-bg)" }}>

              {/* Initial offer */}
              {(!offer || ["declined", "expired"].includes(offer.status)) && (
                <>
                  <button disabled={submittingOffer || !offerAmount}
                    onClick={() => submitOffer("make", Number(offerAmount.replace(/,/g, "")))}
                    style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: !offerAmount ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: !offerAmount ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submittingOffer ? <Spinner /> : "Send Offer"}
                  </button>
                  <button onClick={() => setShowOfferModal(false)}
                    style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </>
              )}

              {/* Seller accepts / counters / declines */}
              {isOwnListing && offer && ["pending", "countered"].includes(offer.status) && (
                <>
                  <button onClick={() => submitOffer("accept")} disabled={submittingOffer}
                    style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submittingOffer ? <Spinner /> : `✅ Accept ₦${offer.latestAmount.toLocaleString("en-NG")}`}
                  </button>
                  {offer.counterCount < 2 && (
                    <button onClick={() => submitOffer("counter", Number(offerAmount.replace(/,/g, "")))} disabled={submittingOffer || !offerAmount}
                      style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-primary)", backgroundColor: "var(--color-light)", color: "var(--color-primary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: !offerAmount ? "not-allowed" : "pointer", opacity: !offerAmount ? 0.5 : 1 }}>
                      ↩ Send counter ₦{offerAmount || "—"}
                    </button>
                  )}
                  <button onClick={() => submitOffer("decline")} disabled={submittingOffer}
                    style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ❌ Decline offer
                  </button>
                </>
              )}

              {/* Buyer accepts / counters / declines seller counter */}
              {!isOwnListing && offer && offer.status === "countered" && (
                <>
                  <button onClick={() => submitOffer("accept")} disabled={submittingOffer}
                    style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submittingOffer ? <Spinner /> : `✅ Accept ₦${offer.latestAmount.toLocaleString("en-NG")}`}
                  </button>
                  {offer.counterCount < 2 && (
                    <button onClick={() => submitOffer("counter", Number(offerAmount.replace(/,/g, "")))} disabled={submittingOffer || !offerAmount}
                      style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px solid var(--color-primary)", backgroundColor: "var(--color-light)", color: "var(--color-primary)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, cursor: !offerAmount ? "not-allowed" : "pointer", opacity: !offerAmount ? 0.5 : 1 }}>
                      ↩ Send counter ₦{offerAmount || "—"}
                    </button>
                  )}
                  <button onClick={() => submitOffer("decline")} disabled={submittingOffer}
                    style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ❌ Decline
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buy modal — reserve */}
      {showBuyModal && !availRequest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBuyModal(false); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--color-header)", margin: "0 0 6px" }}>🔒 Reserve this item</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              We notify the seller to confirm the item is still available before you pay. You will be notified once confirmed.
            </p>
            <div style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Item</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{listing.title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Price</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)" }}>₦{listing.price.toLocaleString("en-NG")}</span>
              </div>
              <div style={{ paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Nothing is charged until you confirm receipt</span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 16px", textAlign: "center" }}>
              📲 {typeof window !== "undefined" && /iPhone|iPad/.test(navigator.userAgent)
                ? "Add CorperNest to your home screen (Safari → Share → Add to Home Screen) to get instant notifications."
                : "Install CorperNest (browser menu → Add to Home Screen) to receive instant notifications."}
            </p>
            <button onClick={handleConfirmAvailability} disabled={submittingAvailability}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: submittingAvailability ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {submittingAvailability ? <Spinner /> : "Reserve & Notify Seller"}
            </button>
            <button onClick={() => setShowBuyModal(false)}
              style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Waiting / confirmed / expired */}
      {showBuyModal && availRequest && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBuyModal(false); }}>
          <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto 20px" }} />

            {availRequest.status === "pending" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 4px" }}>Seller has been notified</h2>
                  <div style={{ display: "inline-block", padding: "6px 20px", borderRadius: 20, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", margin: "8px 0" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-primary)", letterSpacing: "0.05em" }}>{countdown}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                    {availRequest.adminEscalated ? "CorperNest is calling the seller directly" : "Time remaining for seller to confirm"}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 16px", lineHeight: 1.5 }}>
                  We will notify you the moment they confirm. Nothing has left your account.
                </p>
                <button onClick={() => setShowBuyModal(false)}
                  style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>
                  Close — I'll wait for the notification
                </button>
                <button onClick={async () => {
                  try {
                    await fetch("/api/marketplace/availability", {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ requestId: availRequest.id, action: "cancel" }),
                    });
                    setAvailRequest(null);
                    setShowBuyModal(false);
                    router.refresh();
                  } catch { /* silent */ }
                }}
                  style={{ width: "100%", padding: "11px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 12, cursor: "pointer" }}>
                  ↩ Cancel reservation
                </button>
              </>
            )}

            {availRequest.status === "confirmed" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "#15803D", margin: "0 0 4px" }}>Item confirmed available</h2>
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>{availRequest.checkoutMinutesRemaining} minutes to complete payment</p>
                </div>
                <button onClick={() => router.push(`/marketplace/${listing.id}/checkout?availability=${availRequest.id}`)}
                  style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", backgroundColor: "#15803D", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 }}>
                  🔒 Pay ₦{listing.price.toLocaleString("en-NG")} via Escrow
                </button>
                <button onClick={() => setShowBuyModal(false)}
                  style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
                  Pay later (within {availRequest.checkoutMinutesRemaining} min)
                </button>
              </>
            )}

            {availRequest.status === "expired" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⏰</div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "var(--color-header)", margin: "0 0 4px" }}>Reservation expired</h2>
                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>The seller did not confirm in time. The listing is now available again.</p>
                </div>
                <button onClick={() => setAvailRequest(null)}
                  style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                  Try Again
                </button>
                <button onClick={() => setShowBuyModal(false)}
                  style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showPermissionPrompt && (
        <NotificationPermissionPrompt
          context="buy"
          onGranted={() => { setShowPermissionPrompt(false); proceedToBuy(); }}
          onSkip={() => { setShowPermissionPrompt(false); proceedToBuy(); }}
        />
      )}

      {showPhoneVerify && (
        <PhoneVerificationModal
          onClose={() => setShowPhoneVerify(false)}
          onVerified={() => {
            setShowPhoneVerify(false);
            toast.success("Phone verified — you can now complete your purchase.");
            // Proceed to buy flow after verification
            setBuyLoading(true);
            fetch(`/api/marketplace/availability?listingId=${listing.id}`)
              .then((r) => r.json())
              .then((d) => { if (d.request) setAvailRequest(d.request); })
              .catch(() => {})
              .finally(() => { setBuyLoading(false); setShowBuyModal(true); });
          }}
        />
      )}

      {/* Zoom viewer */}
      {zoomOpen && images.length > 0 && (
        <ZoomViewer images={images} startIndex={photoIndex} onClose={() => setZoomOpen(false)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}