// src/app/(main)/parkout/listing/[id]/move-in-breakdown.tsx
// Shows total move-in cost breakdown on listing detail page.
// Incoming tenant sees exactly what they need to bring.

type MoveInFees = {
  cautionFee:   number;
  agreementFee: number;
  extraFees:    Array<{ name: string; amount: number }>;
};

type Props = {
  annualRent:      number; // kobo
  facilitationFee: number; // kobo
  moveInFees:      MoveInFees | null;
};

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default function MoveInBreakdown({ annualRent, facilitationFee, moveInFees }: Props) {
  const caution     = (moveInFees?.cautionFee   ?? 0) * 100; // stored in naira, convert to kobo
  const agreement   = (moveInFees?.agreementFee ?? 0) * 100;
  const extras      = moveInFees?.extraFees ?? [];
  const extraTotal  = extras.reduce((sum, f) => sum + (f.amount * 100), 0);
  const grandTotal  = annualRent + facilitationFee + caution + agreement + extraTotal;
  const hasAnyFees  = caution > 0 || agreement > 0 || extraTotal > 0;

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: 12 }}>

      {/* Header */}
      <div style={{ padding: "10px 14px", backgroundColor: "#1B5E20", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15 }}>💰</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>
          Total move-in cost breakdown
        </p>
      </div>

      {/* Rows */}
      {[
        { label: "Annual rent",       amount: annualRent,      note: "",                    highlight: false },
        { label: "Facilitation fee",  amount: facilitationFee, note: "",                    highlight: false },
        { label: "Caution deposit",   amount: caution,         note: "(refundable)",         highlight: false, skip: caution === 0 },
        { label: "Agreement fee",     amount: agreement,       note: "(non-refundable)",     highlight: false, skip: agreement === 0 },
        ...extras.map((e) => ({
          label:     e.name,
          amount:    e.amount * 100,
          note:      "",
          highlight: false,
          skip:      false,
        })),
      ]
        .filter((r) => !r.skip)
        .map((row, i, arr) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px",
            backgroundColor: i % 2 === 0 ? "var(--color-card)" : "var(--color-bg)",
            borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
          }}>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.label}</span>
              {row.note ? <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: 4 }}>{row.note}</span> : null}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>
              {fmt(row.amount)}
            </span>
          </div>
        ))
      }

      {/* Total */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 14px",
        backgroundColor: "var(--color-light)",
        borderTop: "2px solid var(--color-border)",
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
          Total to move in
        </p>
        <p style={{ fontSize: 16, fontWeight: 900, color: "#1B5E20", margin: 0, fontFamily: "var(--font-heading)" }}>
          {fmt(grandTotal)}
        </p>
      </div>

      {/* Footer notes */}
      <div style={{ padding: "8px 14px", backgroundColor: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}>
        {caution > 0 && (
          <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "0 0 2px" }}>
            ✓ Caution deposit of {fmt(caution)} is refundable when you vacate
          </p>
        )}
        {!hasAnyFees && (
          <p style={{ fontSize: 10, color: "#15803D", margin: 0, fontWeight: 600 }}>
            ✓ No extra fees — rent and facilitation fee only
          </p>
        )}
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
          Fees charged by landlord are paid directly to them — not to CorperNest
        </p>
      </div>
    </div>
  );
}
