// src/app/(main)/parkout/new/components/step-indicator.tsx
// Shows which step the user is on at the top of the form.
// Three steps: Room Details → Photos & Proof → Private Details
// Dots connected by lines — active step highlighted in green.

type Props = {
  currentStep: 1 | 2 | 3;
};

const STEPS = [
  { number: 1, label: "Room Details"    },
  { number: 2, label: "Photos & Proof"  },
  { number: 3, label: "Private Details" },
];

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div style={{
      padding: "16px 20px",
      backgroundColor: "var(--color-card)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 400, margin: "0 auto" }}>
        {STEPS.map((step, i) => {
          const done   = currentStep > step.number;
          const active = currentStep === step.number;

          return (
            <div key={step.number} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
              {/* Circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: done || active ? "var(--color-primary)" : "var(--color-bg)",
                  border: `2px solid ${done || active ? "var(--color-primary)" : "var(--color-border)"}`,
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}>
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "var(--color-text-muted)" }}>
                      {step.number}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: active ? 700 : 500,
                  color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: "0 6px",
                  marginBottom: 14,
                  backgroundColor: currentStep > step.number ? "var(--color-primary)" : "var(--color-border)",
                  transition: "background 0.2s",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}