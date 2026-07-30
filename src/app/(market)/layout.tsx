// src/app/(market)/layout.tsx
// Layout for all marketplace pages — own bottom nav, same header as (main)
// Bottom nav: Browse | My Listings | My Purchases | Profile
// Top header: CorperNest logo → /home, bell notifications, Sell Item button
// Auth is optional — guests can browse, only sellers/buyers need to sign in

"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useFCM } from "@/hooks/use-fcm";
import PWAInstallBanner from "@/components/pwa-install-banner";
import { authClient } from "@/lib/auth-client";
import UserAvatar from "@/components/user-avatar";
import CustomerCare from "@/components/customer-care";


const ADMIN_EMAIL = "corpernestng@gmail.com";

interface NotificationItem {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  link:      string | null;
  read:      boolean;
  createdAt: string;
}

// ── BOTTOM NAV ITEMS ──────────────────────────────────────────────────────────

const navItems = [
  {
    label: "Browse",
    href:  "/marketplace",
    icon:  (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0"
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "My Listings",
    href:  "/marketplace/my-listings",
    icon:  (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" />
        <path d="M7 8h10M7 12h10M7 16h6"
          stroke={active ? "#fff" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Purchases",
    href:  "/marketplace/purchases",
    icon:  (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 7H4a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 12v4M10 14h4"
          stroke={active ? "#fff" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href:  "/profile",
    icon:  (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          fill={active ? "var(--color-primary)" : "none"}
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" />
        <path d="M4 20c0-2.761 3.582-5 8-5s8 2.239 8 5"
          stroke={active ? "var(--color-primary)" : "var(--color-text-muted)"}
          strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ── NOTIFICATION HELPERS ──────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// ── LAYOUT ────────────────────────────────────────────────────────────────────

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [notifOpen,      setNotifOpen]      = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifications,  setNotifications]  = useState<NotificationItem[]>([]);
  const [notifsLoading,  setNotifsLoading]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: session } = authClient.useSession();
  const user      = session?.user as { email?: string | null; role?: string | null } | undefined;
  const isLoggedIn = !!user;
  useFCM(isLoggedIn);
  const isAdmin    = user?.email === ADMIN_EMAIL;

  // ── Unread count polling ──────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res  = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    fetchUnreadCount();

    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchUnreadCount, 120_000);
    };
    const stop = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else { fetchUnreadCount(); start(); }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [isLoggedIn, fetchUnreadCount]);

  // ── Notifications ─────────────────────────────────────────────────────────
  async function handleOpenNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (!opening || !isLoggedIn) return;
    setNotifsLoading(true);
    try {
      const res  = await fetch("/api/notifications/list");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch { /* silent */ }
    finally { setNotifsLoading(false); }
  }

  async function handleCloseNotifications() {
    setNotifOpen(false);
    if (unreadCount === 0 || !isLoggedIn) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: "all" }),
      });
    } catch { /* silent */ }
  }

  function handleNotifClick(notif: NotificationItem) {
    handleCloseNotifications();
    if (notif.link) router.push(notif.link);
  }

  // Sell Item button — requires login
  function handleSellItem() {
    if (!isLoggedIn) { router.push("/signin?redirect=/marketplace/new"); return; }
    router.push("/marketplace/new");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 px-4"
        style={{ backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)", height: 56, display: "flex", alignItems: "center" }}>
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">

          {/* Logo — always goes back to main home */}
          <Link href="/home" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img src="/corperNestLogo.png" alt="CorperNest" style={{ height: 32, width: "auto", display: "block" }} />
          </Link>

          {/* Marketplace pill — shows current context */}
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: "var(--color-light)", color: "var(--color-primary)", border: "1px solid var(--color-border)", flexShrink: 0 }}>
            Marketplace
          </span>

          <div style={{ flex: 1 }} />

          {/* Admin button */}
          {isAdmin && (
            <Link href="/admin/marketplace/listings" className="hidden md:flex"
              style={{ alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: "var(--color-header)", textDecoration: "none", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3"  y="3"  width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.8" />
                <rect x="14" y="3"  width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.8" />
                <rect x="3"  y="14" width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.8" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Admin</span>
            </Link>
          )}

          {/* Sell Item button */}
          <button onClick={handleSellItem}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12, backgroundColor: "var(--color-primary)", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="hidden xs:inline sm:inline"
              style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
              Sell Item
            </span>
          </button>

          {/* Bell */}
          <button onClick={handleOpenNotifications}
            className="relative flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, backgroundColor: notifOpen ? "var(--color-light)" : "var(--color-bg)", border: "1px solid var(--color-border)", flexShrink: 0, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold"
                style={{ minWidth: 16, height: 16, fontSize: 9, backgroundColor: "#E53935", color: "#fff", padding: "0 3px" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="hidden md:block"><UserAvatar /></div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Browse",      href: "/marketplace" },
              { label: "My Listings", href: "/marketplace/my-listings" },
              { label: "Purchases",   href: "/marketplace/purchases" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                style={{ padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: pathname === item.href ? 600 : 400, color: pathname === item.href ? "var(--color-primary)" : "var(--color-text-secondary)", textDecoration: "none" }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── NOTIFICATION DROPDOWN ── */}
        {notifOpen && (
          <>
            <div onClick={handleCloseNotifications} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div className="absolute shadow-lg"
              style={{ top: "calc(100% + 8px)", right: 16, width: "min(360px, calc(100vw - 32px))", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 18, zIndex: 50, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: 0 }}>Notifications</p>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={() => {
                      setUnreadCount(0);
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      fetch("/api/notifications/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: "all" }) });
                    }}
                    style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifsLoading ? (
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1,2,3].map((i) => (
                      <div key={i} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-light)", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 12, borderRadius: 6, background: "var(--color-light)", marginBottom: 6, width: "60%" }} />
                          <div style={{ height: 10, borderRadius: 6, background: "var(--color-light)", width: "85%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                          stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)", margin: "0 0 4px" }}>All caught up</p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif, i) => (
                      <button key={notif.id} onClick={() => handleNotifClick(notif)}
                        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: notif.read ? "transparent" : "var(--color-light)", borderBottom: i < notifications.length - 1 ? "1px solid var(--color-border)" : "none", border: "none", cursor: notif.link ? "pointer" : "default", textAlign: "left" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: notif.read ? 500 : 700, color: "var(--color-header)", fontFamily: "var(--font-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {notif.title}
                            </p>
                            {!notif.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 4 }}>{notif.message}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{timeAgo(notif.createdAt)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2"
        style={{ backgroundColor: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = item.href === "/marketplace"
              ? pathname === "/marketplace"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-4 py-1">
                {item.icon(active)}
                <span className="text-xs"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)", fontFamily: "var(--font-body)", fontWeight: active ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Admin shortcut — mobile */}
          {isAdmin && (
            <Link href="/admin/marketplace/listings" className="flex flex-col items-center gap-1 px-4 py-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3"  y="3"  width="7" height="7" rx="1.5" stroke={pathname.startsWith("/admin") ? "var(--color-header)" : "var(--color-text-muted)"} strokeWidth="1.8" />
                <rect x="14" y="3"  width="7" height="7" rx="1.5" stroke={pathname.startsWith("/admin") ? "var(--color-header)" : "var(--color-text-muted)"} strokeWidth="1.8" />
                <rect x="3"  y="14" width="7" height="7" rx="1.5" stroke={pathname.startsWith("/admin") ? "var(--color-header)" : "var(--color-text-muted)"} strokeWidth="1.8" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={pathname.startsWith("/admin") ? "var(--color-header)" : "var(--color-text-muted)"} strokeWidth="1.8" />
              </svg>
              <span className="text-xs"
                style={{ color: pathname.startsWith("/admin") ? "var(--color-header)" : "var(--color-text-muted)", fontFamily: "var(--font-body)", fontWeight: pathname.startsWith("/admin") ? 600 : 400 }}>
                Admin
              </span>
            </Link>
          )}
        </div>
      </nav>

      <CustomerCare />
      <PWAInstallBanner />
    </div>
  );
}