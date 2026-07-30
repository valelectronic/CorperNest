// src/components/marketplace/listing-summary-modal.tsx
// Summary popup shown to seller before final listing submission.
// Shows item details, earnings breakdown and bank account.
// Seller confirms or goes back to edit.

type Props = {
  title:        string;
  category:     string;
  categoryEmoji: string;
  condition:    string;
  listingType:  "single" | "bundle";
  bundleItems:  string[];
  images:       string[];
  delivery:     "pickup" | "delivery" | "both";
  price:        number;          // in naira
  accountName:  string;
  bankName:     string;
  accountNumber: string;
  hasReceipt:   boolean;
  submitting:   boolean;
  onConfirm:    () => void;
  onBack:       () => void;
};

const COMMISSION = 0.05;

function conditionLabel(c: string): string {
  if (c === "new")           return "✨ New";
  if (c === "fairly-used")   return "♻️ Fairly Used";
  if (c === "heavily-used")  return "🔧 Heavily Used";
  return c;
}

function deliveryLabel(d: string): string {
  if (d === "pickup")   return "Pickup only";
  if (d === "delivery") return "Delivery available";
  return "Pickup or delivery";
}

export default function ListingSummaryModal({
  title, category, categoryEmoji, condition, listingType,
  bundleItems, images, delivery, price, accountName,
  bankName, accountNumber, hasReceipt, submitting,
  onConfirm, onBack,
}: Props) {
  const fee    = Math.round(price * COMMISSION);
  const payout = price - fee;
  const masked = accountNumber.length >= 4
    ? `****${accountNumber.slice(-4)}`
    : accountNumber;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div style={{ backgroundColor: "var(--color-bg)", borderRadius: "20px 20px 0 0", maxHeight: "88dvh", display: "flex", flexDirection: "column" }}>

        {/* Drag handle */}
        <div style={{ flexShrink: 0, padding: "16px 16px 0", textAlign: "center" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "var(--color-border)", margin: "0 auto" }} />
        </div>

        {/* Title */}
        <div style={{ flexShrink: 0, padding: "14px 16px 0" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 2px" }}>
            Review your listing
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
            Confirm the details below before submitting for admin approval.
          </p>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* Item summary row */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            {images[0] ? (
              <img src={images[0]} alt={title}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "var(--color-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                {categoryEmoji}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, color: "var(--color-header)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {title}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
                {categoryEmoji} {category} · {conditionLabel(condition)}
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
                📦 {deliveryLabel(delivery)}
              </p>
              {hasReceipt && (
                <p style={{ fontSize: 11, color: "var(--color-primary)", margin: 0 }}>📄 Receipt available</p>
              )}
              {images.length > 1 && (
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                  {images.length} photos
                </p>
              )}
            </div>
          </div>

          {/* Bundle items */}
          {listingType === "bundle" && bundleItems.filter(Boolean).length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: "var(--color-light)", border: "1px solid var(--color-border)", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Bundle includes
              </p>
              {bundleItems.filter(Boolean).map((item, i) => (
                <p key={i} style={{ fontSize: 13, color: "var(--color-text)", margin: "0 0 2px" }}>• {item}</p>
              ))}
            </div>
          )}

          {/* Earnings breakdown */}
          <div style={{ borderRadius: 14, border: "1.5px solid var(--color-border)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "11px 14px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Listed price</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                ₦{price.toLocaleString("en-NG")}
              </span>
            </div>
            <div style={{ padding: "11px 14px", backgroundColor: "#FEF2F2", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#C62828" }}>CorperNest fee (5%)</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#C62828", fontFamily: "var(--font-heading)" }}>
                −₦{fee.toLocaleString("en-NG")}
              </span>
            </div>
            <div style={{ padding: "13px 14px", backgroundColor: "#E8F5E9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>You receive</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#15803D", fontFamily: "var(--font-heading)" }}>
                ₦{payout.toLocaleString("en-NG")}
              </span>
            </div>
          </div>

          {/* Bank */}
          <div style={{ padding: "11px 14px", borderRadius: 12, backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-primary)" strokeWidth="1.8" />
              <path d="M2 10h20" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{accountName}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>{bankName} · {masked}</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 4px" }}>
            Paid to this account after buyer confirms receipt.
          </p>
        </div>

        {/* Actions */}
        <div style={{ flexShrink: 0, padding: "12px 16px 32px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8, backgroundColor: "var(--color-bg)" }}>
          <button onClick={onConfirm} disabled={submitting}
            style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", backgroundColor: submitting ? "var(--color-border)" : "var(--color-primary)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting
              ? <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              : "✅ Submit listing"}
          </button>
          <button onClick={onBack} disabled={submitting}
            style={{ width: "100%", padding: "12px", borderRadius: 14, border: "none", backgroundColor: "transparent", color: "var(--color-text-muted)", fontSize: 13, cursor: "pointer" }}>
            ← Go back and edit
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}