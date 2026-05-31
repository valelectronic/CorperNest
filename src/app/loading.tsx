// src/app/loading.tsx
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        gap: "16px",
      }}
    >
      {/* Logo */}
      <img
        src="/corperNestLogo.png"
        alt="CoperNest"
        style={{
          width: 120,
          height: "auto",
          objectFit: "contain",
          animation: "cn-pulse 1.4s ease-in-out infinite",
        }}
      />

      {/* Dot spinner */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-primary)",
              display: "block",
              animation: `cn-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes cn-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.96); }
        }
        @keyframes cn-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}