// src/app/(main)/parkout/new/components/commission-preview.tsx
// Shows the 10% property facilitation fee calculated from annual rent.
// The facilitation arrangement is handled outside CorperNest.

type Props = {
  annualRent: number; // in naira (not kobo)
};

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function CommissionPreview({ annualRent }: Props) {
  if (!annualRent || annualRent < 1000) return null;

  const facilitationFee = Math.round(annualRent * 0.10);

  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid var(--color-border)",
      overflow: "hidden",
      marginBottom: 4,
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        backgroundColor: "var(--color-primary)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>💰</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>
          Property facilitation fee
        </p>
      </div>

      {/* Rows */}
      {[
        { label: "Annual rent",                    value: formatNaira(annualRent),       muted: true },
        { label: "Property facilitation fee (10%)", value: formatNaira(facilitationFee), muted: false, highlight: true },
      ].map((row, i) => (
        <div key={row.label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px",
          backgroundColor: row.highlight
            ? "var(--color-light)"
            : i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)",
          borderBottom: i < 1 ? "1px solid var(--color-border)" : "none",
        }}>
          <span style={{
            fontSize: 12,
            color: row.muted ? "var(--color-text-muted)" : "var(--color-text)",
            maxWidth: "60%",
          }}>
            {row.label}
          </span>
          <span style={{
            fontSize: row.highlight ? 15 : 12,
            fontWeight: row.highlight ? 800 : 600,
            color: row.highlight ? "var(--color-primary)" : "var(--color-text-secondary)",
          }}>
            {row.value}
          </span>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ padding: "8px 14px", backgroundColor: "var(--color-light)" }}>
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
          The property facilitation fee is handled outside CorperNest according to the
          arrangement between the relevant parties.
        </p>
      </div>
    </div>
  );
}
