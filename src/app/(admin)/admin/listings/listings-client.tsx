// src/app/admin/listings/listings-client.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PendingListing = {
  id:               string;
  title:            string;
  description:      string;
  address:          string;
  landmark:         string | null;
  lga:              string;
  state:            string;
  price:            number;
  type:             string;
  listingPurpose:   string;
  status:           string;
  images:           string[] | null;
  amenities:        string[] | null;
  customAmenities:  string[] | null;
  agencyFeePercent: number | null;
  createdAt:        Date;
  agentId:          string;
  agentName:        string;
  agentEmail:       string;
  agentPhone:       string | null;
};

type ActiveListing = {
  id:        string;
  title:     string;
  price:     number;
  status:    string;
  type:      string;
  lga:       string;
  images:    string[] | null;
  createdAt: Date;
  agentName: string;
  agentId:   string;
};

type RecentlyDeclined = {
  id:        string;
  title:     string;
  status:    string;
  updatedAt: Date;
  agentName: string;
};

type Props = {
  pending:          PendingListing[];
  recentlyDeclined: RecentlyDeclined[];
  active:           ActiveListing[];
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatPrice(p: number) {
  return `₦${p.toLocaleString("en-NG")}`;
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  "available":         { bg: "#E8F5E9", color: "#2E7D32", label: "Available"     },
  "reserved":          { bg: "#FFF8E1", color: "#92400E", label: "Reserved"      },
  "occupied":          { bg: "#FFEBEE", color: "#C62828", label: "Occupied"      },
  "temp-unavailable":  { bg: "#F3F4F6", color: "#4B5563", label: "Unavailable"   },
  "needs-correction":  { bg: "#FFF8E1", color: "#92400E", label: "Needs Fix"     },
};

const PROPERTY_TYPES = [
  { value: "self-con",  label: "Self Contained" },
  { value: "mini-flat", label: "Mini Flat"       },
  { value: "1-bed",     label: "1 Bedroom"       },
  { value: "2-bed",     label: "2 Bedroom"       },
  { value: "3-bed",     label: "3 Bedroom"       },
  { value: "room",      label: "Single Room"     },
];

const AMENITY_LIST = [
  "running-water","prepaid-meter","band-a-light","band-b-light","tiled-floors",
  "ceiling-fan","furnished","kitchen","bathroom-inside","security-gate",
  "parking-space","fence-compound","good-road-access","close-to-nysc","good-network",
];

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }: {
  images: string[]; startIndex: number; onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  function prev(e: React.MouseEvent) { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }
  function next(e: React.MouseEvent) { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", flexShrink: 0 }}>
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
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <img src={images[index]} alt={`Photo ${index + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: 12, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={next} style={{ position: "absolute", right: 12, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, padding: "12px 16px 20px", display: "flex", gap: 8, overflowX: "auto", justifyContent: "center" }}>
        {images.map((img, i) => (
          <button key={i} onClick={() => setIndex(i)}
            style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: i === index ? "2px solid #fff" : "2px solid rgba(255,255,255,0.25)", cursor: "pointer", padding: 0 }}>
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AdminListingsClient({ pending, recentlyDeclined, active }: Props) {
  const [items,         setItems]         = useState(pending);
  const [activeItems,   setActiveItems]   = useState(active);
  const [declined,      setDeclined]      = useState(recentlyDeclined);
  const [processingId,  setProcessingId]  = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<PendingListing | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [lightbox,      setLightbox]      = useState<{ images: string[]; index: number } | null>(null);
  const [editTarget,    setEditTarget]    = useState<PendingListing | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<{ id: string; title: string } | null>(null);
  const [activeTab,     setActiveTab]     = useState<"pending" | "active">("pending");

  // Edit form state
  const [editTitle,       setEditTitle]       = useState("");
  const [editPrice,       setEditPrice]       = useState("");
  const [editLandmark,    setEditLandmark]    = useState("");
  const [editAddress,     setEditAddress]     = useState("");
  const [editLga,         setEditLga]         = useState("");
  const [editState,       setEditState]       = useState("");
  const [editType,        setEditType]        = useState("");
  const [editPurpose,     setEditPurpose]     = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAmenities,   setEditAmenities]   = useState<string[]>([]);
  const [editImages,      setEditImages]      = useState<string[]>([]);
  const [editSaving,      setEditSaving]      = useState(false);

  function openEdit(l: PendingListing) {
    setEditTarget(l);
    setEditTitle(l.title);
    setEditPrice(l.price.toString());
    setEditLandmark(l.landmark ?? "");
    setEditAddress(l.address);
    setEditLga(l.lga);
    setEditState(l.state);
    setEditType(l.type);
    setEditPurpose(l.listingPurpose);
    setEditDescription(l.description);
    setEditAmenities(l.amenities ?? []);
    setEditImages(l.images ?? []);
  }

  function closeEdit() { setEditTarget(null); }

  function toggleEditAmenity(slug: string) {
    setEditAmenities((prev) => prev.includes(slug) ? prev.filter((a) => a !== slug) : [...prev, slug]);
  }

  function removeEditImage(index: number) {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setProcessingId(id);
    try {
      const res  = await fetch(`/api/admin/listings/${id}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not delete."); return; }
      setItems((prev)       => prev.filter((l) => l.id !== id));
      setActiveItems((prev) => prev.filter((l) => l.id !== id));
      setDeleteTarget(null);
      toast.success("Listing deleted.");
    } catch { toast.error("Network error. Try again."); }
    finally   { setProcessingId(null); }
  }

  // ── Flag (hide active listing from feed) ──────────────────────────────────
  async function handleFlag(id: string) {
    setProcessingId(id);
    try {
      const res  = await fetch(`/api/admin/listings/${id}/flag`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not flag."); return; }
      setActiveItems((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing hidden from feed — agent notified.");
    } catch { toast.error("Network error. Try again."); }
    finally   { setProcessingId(null); }
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  async function handleApprove(listingId: string) {
    setProcessingId(listingId);
    try {
      const res  = await fetch("/api/admin/listings/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to approve."); return; }
      setItems((prev) => prev.filter((l) => l.id !== listingId));
      toast.success("Listing approved and now live.");
    } catch { toast.error("Network error. Try again."); }
    finally   { setProcessingId(null); }
  }

  // ── Decline ────────────────────────────────────────────────────────────────
  async function handleDeclineSubmit() {
    if (!declineTarget) return;
    if (declineReason.trim().length < 5) { toast.error("Please enter a reason."); return; }
    setProcessingId(declineTarget.id);
    try {
      const res  = await fetch("/api/admin/listings/decline", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: declineTarget.id, reason: declineReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to decline."); return; }
      const target = declineTarget;
      setItems((prev)    => prev.filter((l) => l.id !== target.id));
      setDeclined((prev) => [
        { id: target.id, title: target.title, status: "flagged", updatedAt: new Date(), agentName: target.agentName },
        ...prev.slice(0, 9),
      ]);
      setDeclineTarget(null);
      setDeclineReason("");
      toast.success("Listing declined. Agent notified.");
    } catch { toast.error("Network error. Try again."); }
    finally   { setProcessingId(null); }
  }

  // ── Edit save ──────────────────────────────────────────────────────────────
  async function handleEditSave(andApprove = false) {
    if (!editTarget) return;
    if (!editTitle.trim()) { toast.error("Title is required"); return; }
    if (!editPrice || isNaN(Number(editPrice)) || Number(editPrice) <= 0) { toast.error("Valid price is required"); return; }
    if (editImages.length < 2) { toast.error("At least 2 photos required"); return; }

    setEditSaving(true);
    try {
      const saveRes = await fetch(`/api/admin/listings/${editTarget.id}/edit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(), price: Number(editPrice),
          landmark: editLandmark.trim(), address: editAddress.trim(),
          lga: editLga.trim(), state: editState.trim(),
          type: editType, listingPurpose: editPurpose,
          description: editDescription.trim(),
          amenities: editAmenities, images: editImages,
        }),
      });
      if (!saveRes.ok) { const d = await saveRes.json(); toast.error(d.error ?? "Failed to save"); return; }

      if (andApprove) {
        const approveRes = await fetch("/api/admin/listings/approve", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: editTarget.id }),
        });
        if (!approveRes.ok) { toast.error("Edits saved but approval failed — approve manually"); return; }
        setItems((prev) => prev.filter((l) => l.id !== editTarget.id));
        toast.success("Edited and approved — now live ✓");
      } else {
        setItems((prev) => prev.map((l) => l.id === editTarget.id ? {
          ...l, title: editTitle.trim(), price: Number(editPrice),
          landmark: editLandmark.trim() || null, address: editAddress.trim(),
          lga: editLga.trim(), state: editState.trim(), type: editType,
          listingPurpose: editPurpose, description: editDescription.trim(),
          amenities: editAmenities, images: editImages,
        } : l));
        toast.success("Edits saved — approve when ready");
      }
      closeEdit();
    } catch { toast.error("Network error. Try again."); }
    finally   { setEditSaving(false); }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 16px 80px", maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 800, color: "var(--color-header)", margin: "0 0 4px" }}>
          Listings
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          {items.length} pending review · {activeItems.length} active
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, backgroundColor: "var(--color-card)", padding: 4, borderRadius: 14, border: "1px solid var(--color-border)" }}>
        {([
          { key: "pending", label: `Pending Review${items.length > 0 ? ` (${items.length})` : ""}` },
          { key: "active",  label: `Active Listings (${activeItems.length})` },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none",
            backgroundColor: activeTab === tab.key ? "var(--color-primary)" : "transparent",
            color: activeTab === tab.key ? "#fff" : "var(--color-text-muted)",
            cursor: "pointer",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PENDING TAB ── */}
      {activeTab === "pending" && (
        <>
          {items.length === 0 ? (
            <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 4px" }}>All caught up</p>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>No listings waiting for review</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {items.map((l) => {
                const isExpanded     = expandedId === l.id;
                const isProcessing   = processingId === l.id;
                const isNeedsCorrect = l.status === "needs-correction";
                const coverImage     = l.images?.[0] ?? null;
                const agencyFeeNaira = l.agencyFeePercent && l.price
                  ? Math.round(l.price * (l.agencyFeePercent / 100))
                  : null;
                const allAmenities = [...(l.amenities ?? []), ...(l.customAmenities ?? [])];

                return (
                  <div key={l.id} style={{
                    background: "var(--color-card)", border: "1px solid var(--color-border)",
                    borderRadius: 18, overflow: "hidden",
                    opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s",
                  }}>
                    {/* Status stripe */}
                    <div style={{ height: 3, background: isNeedsCorrect ? "#F59E0B" : "var(--color-primary)" }} />

                    {isNeedsCorrect && (
                      <div style={{ background: "#FFF8E1", borderBottom: "1px solid #FAC775", padding: "10px 16px" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                          📞 Waiting for your call — correction needed
                        </p>
                      </div>
                    )}

                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--color-light)" }}>
                          {coverImage
                            ? <img src={coverImage} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" /></svg>
                              </div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                            <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14, color: "var(--color-header)", lineHeight: 1.3 }}>
                              {l.title}
                            </p>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0, background: isNeedsCorrect ? "#FFF8E1" : "var(--color-light)", color: isNeedsCorrect ? "#92400E" : "var(--color-primary)" }}>
                              {isNeedsCorrect ? "Needs Fix" : "Under Review"}
                            </span>
                          </div>
                          {l.landmark && <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--color-primary)", fontWeight: 600 }}>📍 {l.landmark}</p>}
                          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)" }}>{l.address}, {l.lga}</p>
                          <p style={{ margin: "0 0 3px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-primary)" }}>
                            {formatPrice(l.price)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>{l.listingPurpose === "rent" ? "/yr" : ""}</span>
                          </p>
                          {agencyFeeNaira !== null && (
                            <p style={{ margin: 0, fontSize: 11, color: "#B45309", fontWeight: 600 }}>
                              Agency fee: {l.agencyFeePercent}% — ₦{agencyFeeNaira.toLocaleString("en-NG")}
                            </p>
                          )}
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
                            Submitted {formatDate(l.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Agent */}
                      <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--color-border)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Agent</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-header)" }}>{l.agentName}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-text-muted)" }}>{l.agentEmail}</p>
                          {l.agentPhone && (
                            <a href={`tel:${l.agentPhone}`} style={{ margin: 0, fontSize: 11, color: "var(--color-primary)", textDecoration: "none", display: "block", fontWeight: 600 }}>
                              📞 {l.agentPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Expand */}
                      <button onClick={() => setExpandedId(isExpanded ? null : l.id)} style={{
                        width: "100%", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: "var(--color-bg)", border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)", cursor: "pointer", marginBottom: 12,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}>
                        {isExpanded ? "Hide details" : "View full details"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ background: "var(--color-bg)", borderRadius: 12, padding: "12px", border: "1px solid var(--color-border)", marginBottom: 10 }}>
                            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</p>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text)", lineHeight: 1.6 }}>{l.description}</p>
                          </div>
                          {l.images && l.images.length > 0 && (
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                              {l.images.map((img, i) => (
                                <button key={i} onClick={() => setLightbox({ images: l.images!, index: i })}
                                  style={{ padding: 0, border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden", flexShrink: 0, cursor: "zoom-in", background: "none" }}>
                                  <img src={img} alt={`Photo ${i + 1}`} style={{ width: 110, height: 88, objectFit: "cover", display: "block" }} />
                                </button>
                              ))}
                            </div>
                          )}
                          {allAmenities.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {allAmenities.map((a, i) => (
                                <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--color-light)", color: "var(--color-primary)", fontWeight: 600 }}>
                                  {a.replace(/-/g, " ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setDeclineTarget(l)} disabled={isProcessing}
                          style={{ flex: 1, padding: "11px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#FEF2F2", border: "1px solid #FECACA", color: "#C62828", cursor: "pointer" }}>
                          Decline
                        </button>
                        <button onClick={() => setDeleteTarget({ id: l.id, title: l.title })} disabled={isProcessing}
                          style={{ flex: 1, padding: "11px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#FFF0F0", border: "1px solid #FECACA", color: "#B71C1C", cursor: "pointer" }}>
                          🗑 Delete
                        </button>
                        <button onClick={() => openEdit(l)} disabled={isProcessing}
                          style={{ flex: 1, padding: "11px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#3730A3", cursor: "pointer" }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleApprove(l.id)} disabled={isProcessing}
                          style={{ flex: 2, padding: "11px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {isProcessing
                            ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> Approve</>
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently declined */}
          {declined.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Recently Declined
              </p>
              <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
                {declined.map((l, i) => (
                  <div key={l.id} style={{ padding: "12px 16px", borderBottom: i < declined.length - 1 ? "1px solid var(--color-border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{l.agentName} · {formatDate(l.updatedAt)}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#FFEBEE", color: "#C62828", flexShrink: 0 }}>
                      Declined
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ACTIVE LISTINGS TAB ── */}
      {activeTab === "active" && (
        <div>
          {activeItems.length === 0 ? (
            <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: "0 0 4px" }}>No active listings</p>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>Approve pending listings to see them here</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeItems.map((l) => {
                const isProcessing = processingId === l.id;
                const badge = STATUS_BADGE[l.status] ?? { bg: "var(--color-light)", color: "var(--color-text-muted)", label: l.status };
                return (
                  <div key={l.id} style={{
                    background: "var(--color-card)", border: "1px solid var(--color-border)",
                    borderRadius: 14, padding: "12px 14px",
                    opacity: isProcessing ? 0.6 : 1, transition: "opacity 0.2s",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    {/* Thumbnail */}
                    <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--color-light)" }}>
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onClick={() => l.images?.length && setLightbox({ images: l.images, index: 0 })} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#7A9A7A" strokeWidth="1.4" /></svg>
                          </div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13, color: "var(--color-header)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.title}
                      </p>
                      <p style={{ margin: "0 0 3px", fontSize: 11, color: "var(--color-text-muted)" }}>
                        {l.lga} · {l.agentName}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>
                          {formatPrice(l.price)}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, backgroundColor: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleFlag(l.id)} disabled={isProcessing}
                        title="Hide from feed"
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #FAC775", backgroundColor: "#FFF8E1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="4" y1="22" x2="4" y2="15" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteTarget({ id: l.id, title: l.title })} disabled={isProcessing}
                        title="Delete listing"
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #FECACA", backgroundColor: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isProcessing
                          ? <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #FECACA", borderTopColor: "#C62828", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <polyline points="3 6 5 6 21 6" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <>
          <div onClick={() => setDeleteTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
          <div style={{ position: "fixed", left: 16, right: 16, bottom: "50%", transform: "translateY(50%)", zIndex: 50, background: "var(--color-card)", borderRadius: 20, padding: "24px 20px", maxWidth: 400, margin: "0 auto" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)", textAlign: "center", margin: "0 0 6px" }}>
              Delete listing?
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
              "{deleteTarget.title}" will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget.id)} disabled={processingId === deleteTarget.id}
                style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#C62828", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {processingId === deleteTarget.id
                  ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  : "Yes, delete"
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DECLINE SHEET ── */}
      {declineTarget && <div onClick={() => { setDeclineTarget(null); setDeclineReason(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: declineTarget ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        maxWidth: 800, margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
        </div>
        <div style={{ padding: "0 16px 24px" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)", margin: "0 0 4px" }}>Decline listing</p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>{declineTarget?.title}</p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8 }}>
            Reason for declining *
          </label>
          <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={4}
            placeholder="e.g. Images are blurry — please upload clear photos of each room"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", resize: "vertical", fontFamily: "var(--font-body)", boxSizing: "border-box", lineHeight: 1.5, outline: "none" }}
          />
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 16px" }}>Sent to the agent by in-app notification.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setDeclineTarget(null); setDeclineReason(""); }}
              style={{ flex: 1, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleDeclineSubmit} disabled={processingId === declineTarget?.id}
              style={{ flex: 2, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "#C62828", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {processingId === declineTarget?.id
                ? <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                : "Send & Decline"
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── EDIT SHEET ── */}
      {editTarget && <div onClick={closeEdit} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} />}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70,
        background: "var(--color-card)", borderRadius: "22px 22px 0 0",
        transform: editTarget ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        maxWidth: 800, margin: "0 auto", maxHeight: "90dvh",
        display: "flex", flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }}>
        <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "0 auto 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--color-header)" }}>Edit Listing</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{editTarget?.agentName}</p>
            </div>
            <button onClick={closeEdit} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>
            {[
              { label: "Title", value: editTitle, onChange: setEditTitle },
              { label: "Landmark", value: editLandmark, onChange: setEditLandmark, placeholder: "e.g. Near NYSC secretariat" },
              { label: "Full Address", value: editAddress, onChange: setEditAddress },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>{f.label}</label>
                <input value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder={f.placeholder}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Price (₦)</label>
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Purpose</label>
                <select value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }}>
                  <option value="rent">Rent</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>LGA</label>
                <input value={editLga} onChange={(e) => setEditLga(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>State</label>
                <input value={editState} onChange={(e) => setEditState(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Property Type</label>
              <select value={editType} onChange={(e) => setEditType(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 13, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box" }}>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid var(--color-border)", fontSize: 14, color: "var(--color-text)", background: "var(--color-bg)", boxSizing: "border-box", resize: "none", fontFamily: "var(--font-body)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Amenities</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {AMENITY_LIST.map((slug) => {
                  const selected = editAmenities.includes(slug);
                  return (
                    <button key={slug} type="button" onClick={() => toggleEditAmenity(slug)} style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                      backgroundColor: selected ? "var(--color-light)" : "var(--color-bg)",
                      color: selected ? "var(--color-primary)" : "var(--color-text-muted)",
                      borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                    }}>
                      {slug.replace(/-/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                Photos ({editImages.length} remaining)
              </label>
              {editImages.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {editImages.map((img, i) => (
                    <div key={i} style={{ position: "relative", width: 88, height: 72, borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onClick={() => setLightbox({ images: editImages, index: i })} />
                      <button onClick={() => removeEditImage(i)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#E53935", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#E53935", fontWeight: 600 }}>⚠ All photos removed — at least 2 required to approve</p>
              )}
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
                To add photos, decline and ask the agent to resubmit with better photos.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 10 }}>
          <button onClick={() => handleEditSave(false)} disabled={editSaving}
            style={{ flex: 1, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text)", cursor: "pointer" }}>
            {editSaving ? "Saving…" : "Save Only"}
          </button>
          <button onClick={() => handleEditSave(true)} disabled={editSaving}
            style={{ flex: 2, padding: "13px", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "var(--color-primary)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {editSaving
              ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> Save &amp; Approve</>
            }
          </button>
        </div>
      </div>

      {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}