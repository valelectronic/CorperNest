"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import UserAvatar from "@/components/user-avatar";

const navItems = [
  {
    label: "Home",
    href: "/home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
          fill={active ? "#E53935" : "none"}
          stroke={active ? "#E53935" : "var(--color-text-muted)"}
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="18" rx="2"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8"
        />
        <path
          d="M16 2V6M8 2V6M3 10H21"
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8"
        />
        <path
          d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* ── TOP NAV ── */}
      <header
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          backgroundColor: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* Logo */}
          <Link
            href="/home"
            className="text-xl font-bold shrink-0"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
            }}
          >
            Corper<span style={{ fontStyle: "italic" }}>Nest</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11" cy="11" r="8"
                  stroke="var(--color-text-muted)"
                  strokeWidth="2"
                />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="var(--color-text-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, state..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              backgroundColor: notifOpen
                ? "var(--color-light)"
                : "var(--color-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="var(--color-text)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Unread dot */}
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#E53935" }}
            />
          </button>

          {/* Desktop profile avatar */}
         {/* Desktop nav links + avatar */}
<div className="hidden md:flex items-center gap-2">
  {[
    { label: "Watchlist", href: "/watchlist" },
    { label: "Bookings", href: "/bookings" },
  ].map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-light)]"
      style={{
        color: pathname === item.href
          ? "var(--color-primary)"
          : "var(--color-text-secondary)",
        fontFamily: "var(--font-body)",
        fontWeight: pathname === item.href ? 600 : 400,
      }}
    >
      {item.label}
    </Link>
  ))}
  <UserAvatar />
</div>
        </div>

        {/* Notification dropdown */}
        {notifOpen && (
          <div
            className="absolute top-full left-0 right-0 mx-4 mt-2 rounded-2xl shadow-lg z-50 overflow-hidden"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <p
                className="font-semibold text-sm"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-text)",
                }}
              >
                Notifications
              </p>
            </div>
            <div className="px-4 py-8 text-center">
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No notifications yet
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2"
        style={{
          backgroundColor: "var(--color-card)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-1"
              >
                {item.icon(active)}
                <span
                  className="text-xs"
                  style={{
                    color: active
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                    fontFamily: "var(--font-body)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}