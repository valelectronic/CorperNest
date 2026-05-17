"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"user" | "agent" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected) {
      setError("Please select how you want to use CorperNest.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/user/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selected }),
      credentials: "include",
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    if (selected === "agent") {
      router.push("/agent");
    } else {
      router.push("/");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <span
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
            }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text)",
          }}
        >
          How will you use CorperNest?
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          Choose your role. You can only pick one.
        </p>

        {/* Role Cards */}
        <div className="space-y-4 mb-8">
          {/* Corper Card */}
          <button
            onClick={() => setSelected("user")}
            className="w-full text-left rounded-2xl p-5 transition-all"
            style={{
              backgroundColor:
                selected === "user"
                  ? "var(--color-light)"
                  : "var(--color-card)",
              border:
                selected === "user"
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: "var(--color-light)" }}
              >
                🎓
              </div>
              <div>
                <p
                  className="font-bold text-base"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-text)",
                  }}
                >
                  Corper or Nigerian
                </p>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  I am looking for verified housing
                </p>
              </div>
              {/* Selection indicator */}
              <div className="ml-auto">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor:
                      selected === "user"
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    backgroundColor:
                      selected === "user"
                        ? "var(--color-primary)"
                        : "transparent",
                  }}
                >
                  {selected === "user" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Agent Card */}
          <button
            onClick={() => setSelected("agent")}
            className="w-full text-left rounded-2xl p-5 transition-all"
            style={{
              backgroundColor:
                selected === "agent"
                  ? "var(--color-light)"
                  : "var(--color-card)",
              border:
                selected === "agent"
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: "var(--color-light)" }}
              >
                🏠
              </div>
              <div>
                <p
                  className="font-bold text-base"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-text)",
                  }}
                >
                  Housing Agent
                </p>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  I list and manage properties for Corpers
                </p>
              </div>
              {/* Selection indicator */}
              <div className="ml-auto">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor:
                      selected === "agent"
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    backgroundColor:
                      selected === "agent"
                        ? "var(--color-primary)"
                        : "transparent",
                  }}
                >
                  {selected === "agent" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#E53935" }}>
            {error}
          </p>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading || !selected}
          className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-action)",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading)",
          }}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}