"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/custom-signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      // channel tells the verify page whether to say "check your phone"
      // or "check your email" — whichever one actually worked. Phone and
      // name are passed too, so a resend doesn't require retyping anything.
      router.push(
        `/verify?type=customSignup&email=${encodeURIComponent(data.email)}&channel=${data.channel}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}`
      );
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
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
        <div className="mb-8">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            CorperNest
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          Create your account
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
          We will text you a code — if that fails, we will email it instead
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Valentine Odo"
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

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Phone number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
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

          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-light)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            We'll use this to verify your property visits — never for spam.
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#E53935" }}>{error}</p>
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
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <a href="/signin" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}