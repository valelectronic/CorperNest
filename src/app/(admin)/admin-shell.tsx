"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    label: "Listings",
    href: "/admin/listings",
    fullLabel: "Listings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "KYC",
    href: "/admin/kyc",
    fullLabel: "KYC Requests",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Agents",
    href: "/admin/agents",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

const homeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  function handleGoHome() {
    router.push("/home");
  }

  return (
    <>
      {/* ── DESKTOP LAYOUT ── */}
      <div style={{ minHeight: "100dvh", display: "flex", background: "var(--color-bg)" }}>

        <style>{`
          @media (max-width: 768px) {
            .admin-sidebar     { display: none !important; }
            .admin-main        { padding-bottom: 80px !important; }
            .admin-mob-header  { display: flex !important; }
          }
          @media (min-width: 769px) {
            .admin-bottom-nav  { display: none !important; }
            .admin-mob-header  { display: none !important; }
          }
        `}</style>

        {/* ── SIDEBAR (desktop) ── */}
        <aside className="admin-sidebar" style={{
          width: 220, flexShrink: 0,
          background: "var(--color-header)",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100dvh",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <img src="/corperNestLogo.png" alt="CorperNest" style={{ height: 28, width: "auto", filter: "brightness(0) invert(1)" }} />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0 0", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              ADMIN PANEL
            </p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const exact  = item.href === "/admin";
              const active = exact ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10,
                    textDecoration: "none",
                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.5)",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    fontFamily: "var(--font-body)",
                    transition: "all 0.15s",
                  }}
                >
                  {item.icon}
                  {item.fullLabel ?? item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to site */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={handleGoHome}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 10,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.4)", fontSize: 13,
                fontFamily: "var(--font-body)",
              }}
            >
              {homeIcon}
              Back to site
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="admin-main" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>

          {/* Mobile top header */}
          <div className="admin-mob-header" style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-card)",
            alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 30,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/corperNestLogo.png" alt="CorperNest" style={{ height: 22, width: "auto" }} />
              <span style={{
                fontSize: 9, fontWeight: 700, color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
                background: "var(--color-light)", padding: "2px 8px", borderRadius: 20,
              }}>
                ADMIN
              </span>
            </div>
            <button
              onClick={handleGoHome}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-muted)", padding: 4,
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
              }}
            >
              {homeIcon}
            </button>
          </div>

          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="admin-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "var(--color-card)",
        borderTop: "1px solid var(--color-border)",
        display: "flex", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {navItems.map((item) => {
          const exact  = item.href === "/admin";
          const active = exact ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "10px 2px",
                textDecoration: "none",
                color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
            >
              {item.icon}
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}