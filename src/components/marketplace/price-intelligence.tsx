// src/components/marketplace/price-intelligence.tsx
// Shown to BUYERS on the listing detail page
// Displays AI price reference + seller note + Google verify link
// Data stored at listing creation — no extra API calls at view time

type Props = {
  listingPrice:     number;  // in naira
  refPriceMin:      number | null;
  refPriceMax:      number | null;
  refPriceSource:   string | null;
  refPriceContext:  string | null;
  refPriceGoogleUrl: string | null;
  sellerPriceNote:  string | null;
};

export default function MarketplacePriceIntelligence({
  listingPrice,
  refPriceMin,
  refPriceMax,
  refPriceSource,
  refPriceContext,
  refPriceGoogleUrl,
  sellerPriceNote,
}: Props) {
  const hasRef = refPriceMin && refPriceMax;

  // Only three scenarios:
  // 1. Clearly below AI min → show saving (genuine good deal)
  // 2. Within AI range → show range neutrally, no judgment
  // 3. Above AI max → hide comparison entirely, just show Google link
  const clearlyBelow = hasRef && listingPrice < refPriceMin!;
  const withinRange  = hasRef && listingPrice >= refPriceMin! && listingPrice <= refPriceMax!;
  const aboveRange   = hasRef && listingPrice > refPriceMax!;

  const saving  = clearlyBelow ? refPriceMin! - listingPrice : 0;
  const savePct = clearlyBelow && refPriceMin! > 0
    ? Math.round((saving / refPriceMin!) * 100)
    : 0;

  if (!hasRef && !sellerPriceNote) return null;

  return (
    <div style={{ borderRadius: 14, border: "1px solid var(--color-border)", overflow: "hidden", marginTop: 16 }}>

      {/* Header */}
      <div style={{ padding: "10px 14px", backgroundColor: "var(--color-light)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          📊 Price Intelligence
        </p>
        {refPriceGoogleUrl && (
          <a href={refPriceGoogleUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            Verify on Google
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>

      {/* Reference price + comparison — only shown when not above AI range */}
      {hasRef && !aboveRange && (
        <>
          <div style={{ padding: "10px 14px", backgroundColor: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, backgroundColor: "#E8F5E9", color: "#15803D" }}>New</span>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Estimated new price in Nigeria</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
              ₦{refPriceMin!.toLocaleString()} – ₦{refPriceMax!.toLocaleString()}
            </span>
          </div>

          <div style={{ padding: "10px 14px", backgroundColor: clearlyBelow ? "#F0FDF4" : "var(--color-bg)", borderBottom: (sellerPriceNote || refPriceContext) ? "1px solid var(--color-border)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: clearlyBelow ? 3 : 0 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>This listing</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                ₦{listingPrice.toLocaleString()}
              </span>
            </div>
            {clearlyBelow && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600 }}>Potentially saves vs buying new</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>
                  ₦{saving.toLocaleString()} ({savePct}% below new)
                </span>
              </div>
            )}
            {withinRange && (
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
                Within typical new price range — verify on Google to compare.
              </p>
            )}
          </div>
        </>
      )}

      {/* Seller note */}
      {sellerPriceNote && (
        <div style={{ padding: "10px 14px", backgroundColor: "var(--color-bg)", borderBottom: refPriceContext ? "1px solid var(--color-border)" : "none" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Seller's note
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text)", margin: 0, lineHeight: 1.6 }}>
            "{sellerPriceNote}"
          </p>
        </div>
      )}

      {/* Context + disclaimer */}
      {refPriceContext && (
        <div style={{ padding: "8px 14px", backgroundColor: "var(--color-light)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 3px" }}>
            💡 {refPriceContext}
          </p>
          <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0, fontStyle: "italic" }}>
            AI price estimates are based on training data and may vary from current market prices.
            Always verify on Google before buying.
          </p>
        </div>
      )}
    </div>
  );
}