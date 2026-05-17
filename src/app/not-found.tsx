import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="text-center">
        <p
          className="text-8xl font-bold mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
          }}
        >
          404
        </p>
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text)",
          }}
        >
          Page not found
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="font-semibold py-3 px-8 rounded-xl transition-opacity"
          style={{
            backgroundColor: "var(--color-action)",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading)",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}