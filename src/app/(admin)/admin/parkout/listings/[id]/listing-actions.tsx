// src/app/admin/parkout/listings/[id]/listing-actions.tsx
// Admin actions for a Park-Out listing:
// → Approve / Reject
// → Assign ambassador + WhatsApp button
// → Edit move-out date + annual rent
// → Confirm handover
// → Delete listing (admin bypass — removes from DB + Cloudinary)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateWaLink, ambassadorAssignedMessage } from "@/lib/whatsapp-link";

type Ambassador = {
  id:           string;
  name:         string;
  territoryLga: string;
  whatsappNumber?: string;
};

type Props = {
  listingId:             string;
  status:                string;
  ambassadors:           Ambassador[];
  currentAmbassadorId:   string | null;
  // For WhatsApp message
  listingTitle:          string;
  lga:                   string;
  moveOutDate:           string;
  outgoingTenantName:    string;
  outgoingTenantPhone:   string;
  // For edit
  currentMoveOutDate:    string;
  currentAnnualRent:     number; // naira
};

function Btn({ label, onClick, color, disabled, outline }: {
  label: string; onClick: () => void; color: string;
  disabled?: boolean; outline?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
        border: outline ? `1.5px solid ${color}` : "none",
        backgroundColor: disabled ? "var(--color-border)" : outline ? "transparent" : color,
        color: disabled ? "#fff" : outline ? color : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-heading)",
      }}>
      {label}
    </button>
  );
}

export default function AdminListingActions({
  listingId, status, ambassadors, currentAmbassadorId,
  listingTitle, lga, moveOutDate, outgoingTenantName, outgoingTenantPhone,
  currentMoveOutDate, currentAnnualRent,
}: Props) {
  const router = useRouter();
  const [loading,          setLoading]          = useState(false);
  const [showReject,       setShowReject]       = useState(false);
  const [rejectReason,     setRejectReason]     = useState("");
  const [selectedAmbass,   setSelectedAmbass]   = useState(currentAmbassadorId ?? "");
  const [assignedAmbass,   setAssignedAmbass]   = useState<Ambassador | null>(null);
  const [showHandover,     setShowHandover]     = useState(false);
  const [showDelete,       setShowDelete]       = useState(false);
  const [showEdit,         setShowEdit]         = useState(false);
  const [editMoveOut,      setEditMoveOut]      = useState(currentMoveOutDate);
  const [editRent,         setEditRent]         = useState(String(currentAnnualRent));

  async function callAction(endpoint: string, body: object) {
    setLoading(true);
    try {
      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Action failed."); return false; }
      toast.success("Done ✓");
      router.refresh();
      return true;
    } catch { toast.error("Network error. Try again."); return false; }
    finally { setLoading(false); }
  }

  async function handleApprove() { await callAction("/api/admin/parkout/listings/approve", { listingId }); }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error("Enter a rejection reason."); return; }
    const ok = await callAction("/api/admin/parkout/listings/reject", { listingId, reason: rejectReason.trim() });
    if (ok) setShowReject(false);
  }

  async function handleAssign() {
    if (!selectedAmbass) { toast.error("Select an ambassador."); return; }
    const ok = await callAction("/api/admin/parkout/listings/assign-ambassador", { listingId, ambassadorId: selectedAmbass });
    if (ok) {
      const amb = ambassadors.find((a) => a.id === selectedAmbass);
      if (amb) setAssignedAmbass(amb);
    }
  }

  async function handleEdit() {
    if (!editMoveOut) { toast.error("Select a move-out date."); return; }
    if (!editRent || isNaN(Number(editRent)) || Number(editRent) < 10000) {
      toast.error("Enter a valid annual rent."); return;
    }
    const ok = await callAction("/api/admin/parkout/listings/edit", { listingId, moveOutDate: editMoveOut, annualRent: Number(editRent) });
    if (ok) setShowEdit(false);
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/parkout/listings/delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed."); return; }
      toast.success("Listing deleted.");
      router.push("/admin/parkout/listings");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  }

  // Build WhatsApp link for assigned ambassador
  const waAmb = assignedAmbass ?? ambassadors.find((a) => a.id === currentAmbassadorId);
  const waLink = waAmb?.whatsappNumber
    ? generateWaLink(
        waAmb.whatsappNumber,
        ambassadorAssignedMessage({
          ambassadorName:      waAmb.name,
          listingTitle,
          lga,
          outgoingTenantName,
          outgoingTenantPhone,
          moveOutDate,
          listingId,
        })
      )
    : null;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13,
    border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)",
    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
    fontFamily: "var(--font-body)",
  };

  return (
    <div style={{ borderRadius: 14, padding: "14px 16px", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
        Admin actions
      </p>

      {/* ── Approve / Reject ── */}
      {status === "pending_approval" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Btn label="✓ Approve"  onClick={handleApprove}              color="#15803D" disabled={loading} />
          <Btn label="✗ Reject"   onClick={() => setShowReject(!showReject)} color="#C62828" disabled={loading} />
        </div>
      )}

      {showReject && (
        <div style={{ marginBottom: 12 }}>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (sent to outgoing tenant)"
            rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.6, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Cancel"           onClick={() => setShowReject(false)} color="var(--color-border)" outline />
            <Btn label="Confirm rejection" onClick={handleReject}              color="#C62828" disabled={loading} />
          </div>
        </div>
      )}

      {/* ── Assign ambassador ── */}
      {(status === "active" || status === "pending_approval") && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>
            {currentAmbassadorId ? "Reassign ambassador" : "Assign ambassador"}
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={selectedAmbass} onChange={(e) => setSelectedAmbass(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}>
              <option value="">Select ambassador</option>
              {ambassadors.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.territoryLga}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={loading || !selectedAmbass}
              style={{ padding: "11px 16px", borderRadius: 10, border: "none", backgroundColor: loading || !selectedAmbass ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading || !selectedAmbass ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              Assign
            </button>
          </div>

          {/* WhatsApp button — shows after assign or if already assigned */}
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", textDecoration: "none", marginTop: 4 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#15803D", margin: 0 }}>WhatsApp Ambassador</p>
                <p style={{ fontSize: 11, color: "#2E7D32", margin: 0 }}>Tap to send assignment details to {waAmb?.name}</p>
              </div>
            </a>
          )}
          {currentAmbassadorId && !waAmb?.whatsappNumber && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              ⚠️ Ambassador has no WhatsApp number on file
            </p>
          )}
        </div>
      )}

      {/* ── Edit listing ── */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowEdit(!showEdit)}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
          ✏️ Edit listing details
        </button>

        {showEdit && (
          <div style={{ marginTop: 10, padding: "14px", borderRadius: 10, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                Move-out date
              </label>
              <input type="date" value={editMoveOut} onChange={(e) => setEditMoveOut(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
                Annual rent (₦)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>₦</span>
                <input type="number" value={editRent} onChange={(e) => setEditRent(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 26 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn label="Cancel"       onClick={() => setShowEdit(false)} color="var(--color-border)" outline />
              <Btn label="Save changes" onClick={handleEdit}               color="var(--color-primary)" disabled={loading} />
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm handover ── */}
      {status === "active" && (
        <div style={{ marginBottom: 12 }}>
          {!showHandover ? (
            <button onClick={() => setShowHandover(true)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #A5D6A7", backgroundColor: "#E8F5E9", color: "#15803D", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🤝 Confirm handover
            </button>
          ) : (
            <div style={{ padding: "14px", borderRadius: 10, backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", margin: "0 0 6px" }}>Confirm handover?</p>
              <p style={{ fontSize: 12, color: "#2E7D32", margin: "0 0 12px", lineHeight: 1.6 }}>
                This confirms that the handover has been completed.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn label="Cancel"          onClick={() => setShowHandover(false)} color="var(--color-border)" outline />
                <Btn label="Yes, confirm"    onClick={() => callAction("/api/admin/parkout/listings/confirm-handover", { listingId })} color="#15803D" disabled={loading} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete listing ── */}
      <div>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px solid #FFCDD2", backgroundColor: "transparent", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            🗑 Delete listing permanently
          </button>
        ) : (
          <div style={{ padding: "14px", borderRadius: 10, backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#C62828", margin: "0 0 6px" }}>⚠️ Delete this listing?</p>
            <p style={{ fontSize: 12, color: "#C62828", margin: "0 0 12px", lineHeight: 1.6 }}>
              This permanently removes the listing, all photos and proof of occupancy from Cloudinary and the database. Cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn label="Cancel"      onClick={() => setShowDelete(false)} color="var(--color-border)" outline />
              <Btn label="Yes, delete" onClick={handleDelete}               color="#C62828" disabled={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}