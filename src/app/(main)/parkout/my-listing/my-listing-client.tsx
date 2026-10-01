// src/app/(main)/parkout/my-listing/my-listing-client.tsx
// Client component — shows user's own listings with all states.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

type Listing = {
  id:                   string;
  title:                string;
  roomType:             string;
  lga:                  string;
  state:                string;
  neighbourhood:        string;
  annualRent:           number;
  facilitationFee:      number;
  moveOutDate:          Date | string | null;
  images:               string[] | null;
  status:               string;
  verifiedByAmbassador: boolean;
  createdAt:            Date | string;
  approvedAt:           Date | string | null;
};

type Props = { listings: Listing[]; userName: string };

const ROOM_LABELS: Record<string, string> = {
  "self-con":  "Self Contained",
  "mini-flat": "Mini Flat",
  "room":      "Single Room",
  "1-bed":     "1 Bedroom Flat",
  "2-bed":     "2 Bedroom Flat",
};

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function getDaysLeft(date: Date | string | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.floor(diff / 86400000);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_approval: { label: "Pending review",  color: "#F59E0B", bg: "#FFF8E1", icon: "⏳" },
  active:           { label: "Live",            color: "#15803D", bg: "#E8F5E9", icon: "✅" },
  completed:        { label: "Deal completed",  color: "#3949AB", bg: "#E8EAF6", icon: "🤝" },
  rejected:         { label: "Not approved",    color: "#C62828", bg: "#FFEBEE", icon: "❌" },
};

// ── Single listing card ───────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: Listing }) {
  const router        = useRouter();
  const [deleting,    setDeleting]    = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const daysLeft      = getDaysLeft(listing.moveOutDate);
  const sc            = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.pending_approval;
  const photo         = listing.images?.[0];

  async function handleDelete() {
    setDeleting(true);
    try {
      const res  = await fetch("/api/parkout/listings/delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed."); return; }
      toast.success("Listing deleted.");
      router.refresh();
    } catch { toast.error("Network error."); }
    finally { setDeleting(false); }
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)", marginBottom: 14 }}>

      {/* Photo */}
      {photo && (
        <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
          <img src={photo} alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
              {sc.icon} {sc.label}
            </span>
            {listing.verifiedByAmbassador && listing.status === "active" && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D", border: "1px solid #A5D6A7" }}>
                ✓ Ambassador verified
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>

        {/* Title */}
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 800, color: "var(--color-text)", margin: "0 0 2px" }}>
          {listing.title}
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          {listing.neighbourhood}, {listing.lga} · {ROOM_LABELS[listing.roomType] ?? listing.roomType}
        </p>

        {/* Rent + facilitation fee */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ padding: "10px 12px", borderRadius: 12, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Annual rent</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmt(listing.annualRent)}</p>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 12, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Property facilitation fee</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmt(listing.facilitationFee)}</p>
          </div>
        </div>

        {/* Move-out countdown — active only */}
        {listing.status === "active" && daysLeft !== null && (
          <div style={{ borderRadius: 12, padding: "10px 14px", marginBottom: 12, backgroundColor: daysLeft < 3 ? "#FFEBEE" : daysLeft < 7 ? "#FFF8E1" : "var(--color-light)", border: `1px solid ${daysLeft < 3 ? "#FFCDD2" : daysLeft < 7 ? "#FAC775" : "var(--color-border)"}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: daysLeft < 3 ? "#C62828" : daysLeft < 7 ? "#F59E0B" : "var(--color-text-muted)" }}>
              ⏱ {daysLeft === 0 ? "Move-out date has passed" : `Moving out in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}

        {/* State-specific info cards */}
        {listing.status === "pending_approval" && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#FFF8E1", border: "1px solid #FAC775", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", margin: "0 0 4px" }}>Under review</p>
            <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
              We are reviewing your listing. You will be notified once it goes live — usually within 24 hours.
            </p>
          </div>
        )}

        {listing.status === "active" && !listing.verifiedByAmbassador && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
              🔍 An ambassador will call you shortly to verify your listing details.
            </p>
          </div>
        )}

        {listing.status === "active" && listing.verifiedByAmbassador && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: "#2E7D32", margin: 0, lineHeight: 1.6 }}>
              ✓ Ambassador has verified your listing. Incoming tenants can now book inspections.
            </p>
          </div>
        )}

        {listing.status === "completed" && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#E8EAF6", border: "1px solid #9FA8DA", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#3949AB", margin: "0 0 4px" }}>Deal completed 🎉</p>
            <p style={{ fontSize: 12, color: "#3949AB", margin: 0, lineHeight: 1.6 }}>
              This Park-Out deal has been completed. Any payment arrangements are handled outside CorperNest.
            </p>
          </div>
        )}

        {listing.status === "rejected" && (
          <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#C62828", margin: "0 0 4px" }}>Not approved</p>
            <p style={{ fontSize: 12, color: "#C62828", margin: 0, lineHeight: 1.6 }}>
              Your listing was not approved. Check your notifications for the reason. You can submit a new listing.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* View listing — active only */}
          {listing.status === "active" && (
            <Link href={`/parkout/listing/${listing.id}`}
              style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 12, backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
              View listing →
            </Link>
          )}

          {/* Relist — rejected only */}
          {listing.status === "rejected" && (
            <Link href="/parkout/new"
              style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "11px", borderRadius: 12, backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
              List a new room →
            </Link>
          )}

          {/* Delete — pending or rejected only */}
          {(listing.status === "pending_approval" || listing.status === "rejected") && (
            !showDelete ? (
              <button onClick={() => setShowDelete(true)}
                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid #FFCDD2", backgroundColor: "transparent", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Delete
              </button>
            ) : (
              <div style={{ flex: 1, display: "flex", gap: 6 }}>
                <button onClick={() => setShowDelete(false)}
                  style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", backgroundColor: "#C62828", color: "#fff", fontSize: 12, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer" }}>
                  {deleting ? "…" : "Confirm"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function MyListingClient({ listings, userName }: Props) {
  const firstName = userName.split(" ")[0];

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ padding: "16px 16px 14px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Park-Out & Earn
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            My Listing
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* No listings */}
        {listings.length === 0 && (
          <div style={{ borderRadius: 16, padding: "40px 24px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
            <p style={{ fontSize: 48, margin: "0 0 12px" }}>🏠</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: "0 0 6px" }}>
              No listing yet, {firstName}
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
              Park out your room when you are moving and connect with the next tenant through CorperNest.
            </p>
            <Link href="/parkout/new"
              style={{ display: "inline-block", padding: "13px 28px", borderRadius: 14, backgroundColor: "var(--color-primary)", color: "#fff", textDecoration: "none", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>
              List my room + earn →
            </Link>
          </div>
        )}

        {/* Has listings */}
        {listings.length > 0 && (
          <>
            {/* Summary if has active listing */}
            {listings.some((l) => l.status === "active") && (
              <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#2E7D32", margin: "0 0 2px", textTransform: "uppercase" }}>Your room is live</p>
                  <p style={{ fontSize: 12, color: "#2E7D32", margin: 0 }}>Incoming tenants can see and book your room</p>
                </div>
                <span style={{ fontSize: 24 }}>🟢</span>
              </div>
            )}

            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}

            {/* Add another listing — only if no active or pending */}
            {!listings.some((l) => l.status === "active" || l.status === "pending_approval") && (
              <Link href="/parkout/new"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 14, backgroundColor: "var(--color-card)", border: "1.5px dashed var(--color-border)", textDecoration: "none", color: "var(--color-primary)", fontSize: 13, fontWeight: 700 }}>
                + List another room
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}