"use client";

// ─── NETWORK ERROR STATE ──────────────────────────────────────────────────────
// Reusable inline component for when a specific request fails (e.g. the
// property feed won't load) — different from OfflineOverlay, which covers
// total loss of internet. Use this inside any page where a fetch can fail.
//
// Usage example:
//   {loadError ? (
//     <NetworkErrorState onRetry={() => fetchListings()} retrying={loading} />
//   ) : ( ...your normal content... )}

type Props = {
  title?:    string;
  message?:  string;
  onRetry:   () => void;
  retrying?: boolean;
};

export default function NetworkErrorState({
  title    = "Couldn't load this",
  message  = "Something went wrong loading this content. Check your connection and try again.",
  onRetry,
  retrying = false,
}: Props) {
  return (
    <div
      className="rounded-2xl p-10 flex flex-col items-center text-center"
      style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "#FCEBEB" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.36 9.36 8.64 9.36 5 13z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M9 17l2 2c.55-.55 1.45-.55 2 0l2-2c-1.66-1.66-4.34-1.66-6 0z" stroke="#E53935" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
        {title}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)", maxWidth: 260, lineHeight: 1.6 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="text-xs font-semibold px-4 py-2 rounded-xl"
        style={{
          backgroundColor: retrying ? "var(--color-border)" : "var(--color-light)",
          color: retrying ? "var(--color-text-muted)" : "var(--color-primary)",
          cursor: retrying ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}