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
      {/* Animated logo mark */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "14px",
          background: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "cn-pulse 1.4s ease-in-out infinite",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* House silhouette */}
          <path
            d="M13 3L2 11.5V23h8v-7h6v7h8V11.5L13 3Z"
            fill="white"
            fillOpacity="0.9"
          />
        </svg>
      </div>

      {/* Dot spinner */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
        }}
      >
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
          50% { opacity: 0.75; transform: scale(0.93); }
        }
        @keyframes cn-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}