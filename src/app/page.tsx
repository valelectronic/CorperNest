import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col min-h-screen md:hidden">
        
        {/* Dark hero */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
          style={{ backgroundColor: "var(--color-header)" }}
        >
          {/* CN Logo */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
            style={{ backgroundColor: "var(--color-action)" }}
          >
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              CN
            </span>
          </div>

          {/* Brand */}
          <h1
            className="text-4xl font-bold text-white mb-3 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Corper
            <span
              style={{
                color: "var(--color-action)",
                fontStyle: "italic",
              }}
            >
              Nest
            </span>
          </h1>

          <p
            className="text-sm leading-relaxed mb-10 max-w-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Verified housing. Safe payments. Real trust.
            <br />
            Built for Corpers and all Nigerians.
          </p>

          

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["🏠 Verified Listings", "🛡️ Escrow Protection", "⭐ Top Agents"].map(
              (pill) => (
                <span
                  key={pill}
                  className="text-xs px-4 py-2 rounded-full"
                  style={{
                    border: "1px solid rgba(67,160,71,0.5)",
                    color: "var(--color-action)",
                    backgroundColor: "rgba(67,160,71,0.08)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {pill}
                </span>
              )
            )}
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          className="px-6 pt-8 pb-10 rounded-t-3xl space-y-3"
          style={{ backgroundColor: "var(--color-card)" }}
        >
          {/* Trust line */}
          <p
            className="text-center text-xs mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            Trusted by Corpers across all 36 states
          </p>

          <Link
            href="/signup"
            className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl gap-2"
            style={{
              backgroundColor: "var(--color-action)",
              color: "#FFFFFF",
              fontFamily: "var(--font-heading)",
            }}
          >
            Get Started — Free
            <span className="text-lg">→</span>
          </Link>

          <Link
            href="/signin"
            className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl"
            style={{
              border: "1.5px solid var(--color-action)",
              color: "var(--color-action)",
              fontFamily: "var(--font-heading)",
            }}
          >
            I Have an Account
          </Link>

          <p
            className="text-center text-sm pt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Link
              href="/properties"
              style={{ color: "var(--color-text-muted)" }}
            >
              Browse without signing up →
            </Link>
          </p>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:flex min-h-screen">
        
        {/* Left — dark hero */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-16 text-center"
          style={{ backgroundColor: "var(--color-header)" }}
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
            style={{ backgroundColor: "var(--color-action)" }}
          >
            <span
              className="text-4xl font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              CN
            </span>
          </div>

          <h1
            className="text-5xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Corper
            <span
              style={{
                color: "var(--color-action)",
                fontStyle: "italic",
              }}
            >
              Nest
            </span>
          </h1>

          <p
            className="text-base leading-relaxed mb-10 max-w-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Verified housing. Safe payments. Real trust.
            Built for Corpers and all Nigerians.
          </p>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["🏠 Verified Listings", "🛡️ Escrow Protection", "⭐ Top Agents"].map(
              (pill) => (
                <span
                  key={pill}
                  className="text-sm px-5 py-2 rounded-full"
                  style={{
                    border: "1px solid rgba(67,160,71,0.5)",
                    color: "var(--color-action)",
                    backgroundColor: "rgba(67,160,71,0.08)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {pill}
                </span>
              )
            )}
          </div>
        </div>

        {/* Right — white action panel */}
        <div
          className="w-full max-w-md flex flex-col justify-center px-12 py-16"
          style={{ backgroundColor: "var(--color-card)" }}
        >
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-text)",
            }}
          >
            Find your next home
          </h2>
          <p
            className="text-sm mb-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            Join thousands of Corpers who found verified housing through CorperNest.
          </p>

          <div className="space-y-3 mb-8">
            <Link
              href="/signup"
              className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl gap-2"
              style={{
                backgroundColor: "var(--color-action)",
                color: "#FFFFFF",
                fontFamily: "var(--font-heading)",
              }}
            >
              Get Started — Free →
            </Link>

            <Link
              href="/signin"
              className="flex items-center justify-center w-full font-semibold py-4 rounded-2xl"
              style={{
                border: "1.5px solid var(--color-action)",
                color: "var(--color-action)",
                fontFamily: "var(--font-heading)",
              }}
            >
              I Have an Account
            </Link>

            <p
              className="text-center text-sm pt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Link
                href="/properties"
                style={{ color: "var(--color-text-muted)" }}
              >
                Browse without signing up →
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--color-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs font-semibold mb-3"
              style={{
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              WHY CORPERS TRUST US
            </p>
            <div className="space-y-2">
              {[
                "✓ Agent identity verified before listing",
                "✓ Rent held in escrow until you move in",
                "✓ Real reviews from past Corpers",
                "✓ OTP verification at every viewing",
              ].map((item) => (
                <p
                  key={item}
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}