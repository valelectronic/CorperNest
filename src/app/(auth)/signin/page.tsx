"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });

    if (error) {
      setError(error.message ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    localStorage.setItem("pending_email", email);
    router.push("/verify?type=signin");
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
          Welcome back
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          Enter your email to receive a login code
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {/* Info notice */}
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-light)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            A 6-digit code will be sent to your email. No password needed.
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#E53935" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-action)",
              color: "#FFFFFF",
              fontFamily: "var(--font-heading)",
            }}
          >
            {loading ? "Sending code..." : "Send login code"}
          </button>
        </form>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          No account yet?{" "}
          <a
            href="/signup"
            className="font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}