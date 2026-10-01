// src/app/(main)/parkout/listing/[id]/transport-estimates.tsx
// Shows daily transport cost table on listing detail page.
// Clean table — no toggle needed. Landmark names typed by outgoing tenant.

type Landmark = {
  name:     string;
  bikeCost: number;
  kekeCost: number;
};

type Props = {
  estimates: Landmark[];
};

function formatNaira(amount: number) {
  if (!amount || amount === 0) return "N/A";
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function TransportEstimates({ estimates }: Props) {
  if (!estimates || estimates.length === 0) return null;

  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      border: "1px solid var(--color-border)",
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        backgroundColor: "var(--color-primary)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 15 }}>🗺</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>
          Daily transport estimates
        </p>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto auto",
        padding: "8px 14px",
        backgroundColor: "var(--color-light)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)" }}>Destination</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", minWidth: 64, textAlign: "center" }}>🚲 Bike</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", minWidth: 64, textAlign: "center" }}>🛺 Keke</span>
      </div>

      {/* Rows */}
      {estimates.map((landmark, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr auto auto",
          padding: "11px 14px",
          backgroundColor: i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)",
          borderBottom: i < estimates.length - 1 ? "1px solid var(--color-border)" : "none",
          alignItems: "center",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
            {landmark.name}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", margin: 0, minWidth: 64, textAlign: "center" }}>
            {formatNaira(landmark.bikeCost)}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0, minWidth: 64, textAlign: "center" }}>
            {formatNaira(landmark.kekeCost)}
          </p>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ padding: "8px 14px", backgroundColor: "var(--color-light)" }}>
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
          Estimates provided by outgoing tenant. Actual costs may vary.
        </p>
      </div>
    </div>
  );
}