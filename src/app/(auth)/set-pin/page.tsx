"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    const code = pin.join("");
    if (code.length < 4) {
      setError("Enter a 4-digit PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      router.push("/home");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
      >
        <div className="mb-6">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          Create a PIN
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
          Use this 4-digit PIN to log in faster next time — no code needed.
        </p>

        <div className="flex items-center justify-center gap-3 mb-2">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el; }}
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-bold rounded-xl focus:outline-none"
              style={{
                border: digit ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                backgroundColor: loading ? "var(--color-light)" : "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-mono)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setShowPin((s) => !s)}
          type="button"
          className="text-xs font-medium mb-6 block mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          {showPin ? "Hide PIN" : "Show PIN"}
        </button>

        {error && (
          <p className="text-sm mb-4 text-center" style={{ color: "#E53935" }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || pin.join("").length < 4}
          className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            backgroundColor: "var(--color-action)",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading)",
          }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}