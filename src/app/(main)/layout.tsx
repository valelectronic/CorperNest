// src/app/(main)/layout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import UserAvatar from "@/components/user-avatar";
import CustomerCare from "@/components/customer-care";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ModalType = "corper-switch" | "agent-kyc" | null;

interface NotificationItem {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  link:      string | null;
  read:      boolean;
  createdAt: string;
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────

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

// ─── NOTIFICATION ICON MAP ────────────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const icons: Record<string, { bg: string; svg: React.ReactNode }> = {
    "booking-created": {
      bg: "#E8F5E9",
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2E7D32" strokeWidth="1.8" />
          <path d="M16 2V6M8 2V6M3 10H21" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    "date-proposed": {
      bg: "#FFF8E1",
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="1.8" />
          <path d="M12 7v5l3 3" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    "both-confirmed": {
      bg: "#E8F5E9",
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    "agent-verified": {
      bg: "#E8F5E9",
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z"
            stroke="#2E7D32" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  };

  const icon = icons[type] ?? {
    bg: "var(--color-light)",
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: icon.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {icon.svg}
    </div>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// ─── LIST PROPERTY MODAL ──────────────────────────────────────────────────────

function ListPropertyModal({
  type,
  onClose,
  onConfirm,
}: {
  type: ModalType;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!type) return null;
  const isCorper = type === "corper-switch";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", background: "var(--color-card)", borderRadius: "22px 22px 0 0", padding: "8px 16px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)", margin: "8px auto 20px" }} />
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          {isCorper ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" />
              <path d="M4 20c0-2.761 3.582-5 8-5s8 2.239 8 5" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M17 3l2 2-2 2M19 5H15M7 13l-2 2 2 2M5 15h4" stroke="var(--color-action)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 4.418 3.582 8 8 8s8-3.582 8-8V6L12 2Z" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 800, color: "var(--color-header)", margin: "0 0 8px", lineHeight: 1.3 }}>
          {isCorper ? "Switch to Agent Account" : "Agent Verification Required"}
        </p>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 24px" }}>
          {isCorper
            ? "You're currently on a Client account. To list properties on CorperNest, you need to switch to an Agent account. Your saved properties and bookings won't be affected."
            : "Before you can start listing, our team needs to verify your identity with a quick phone call. This usually takes less than 24 hours and only happens once."}
        </p>
        {!isCorper && (
          <div style={{ background: "var(--color-bg)", borderRadius: 14, padding: "12px 14px", marginBottom: 24, border: "1px solid var(--color-border)" }}>
            {["We'll call the phone number on your account", "Quick identity check — one call, never repeated", "You'll get an email once you're approved"].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-primary)" }}>{i + 1}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={onConfirm} style={{ width: "100%", padding: "15px", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
          {isCorper ? "Switch to Agent Account" : "Apply for Verification"}
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "15px", background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 14, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
      
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [notifOpen, setNotifOpen]           = useState(false);
  const [modal, setModal]                   = useState<ModalType>(null);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifications, setNotifications]   = useState<NotificationItem[]>([]);
  const [notifsLoading, setNotifsLoading]   = useState(false);
  const intervalRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: session } = authClient.useSession();
  const user = session?.user as {
    role?: string | null;
    agentVerified?: boolean | null;
  } | undefined;

  const isLoggedIn = !!user;
const [isVerifiedAgent, setIsVerifiedAgent] = useState(false);

useEffect(() => {
  if (!isLoggedIn || user?.role !== "agent") {
    setIsVerifiedAgent(false);
    return;
  }
  fetch("/api/user/agent-status")
    .then((r) => r.json())
    .then((data) => setIsVerifiedAgent(data.agentVerified ?? false))
    .catch(() => setIsVerifiedAgent(user?.agentVerified ?? false));
}, [isLoggedIn, user?.role]);

  // ── Poll unread count every 30s ───────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res  = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch {
      // silent — badge just doesn't update
    }
  }, [isLoggedIn]);

  // Replace the existing polling useEffect with this:
useEffect(() => {
  if (!isLoggedIn) {
    setUnreadCount(0);
    return;
  }

  // Fetch immediately on mount
  fetchUnreadCount();

  const startPolling = () => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(fetchUnreadCount, 30_000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "hidden") {
      stopPolling();
    } else {
      // Tab came back — fetch immediately then restart interval
      fetchUnreadCount();
      startPolling();
    }
  };

  startPolling();
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    stopPolling();
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [isLoggedIn, fetchUnreadCount]);


  // ── Fetch full list when dropdown opens ──────────────────────────────────
  async function handleOpenNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);

    if (!opening || !isLoggedIn) return;

    setNotifsLoading(true);
    try {
      const res  = await fetch("/api/notifications/list");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silent
    } finally {
      setNotifsLoading(false);
    }
  }

  // ── Mark all read when dropdown closes ───────────────────────────────────
  async function handleCloseNotifications() {
    setNotifOpen(false);
    if (unreadCount === 0 || !isLoggedIn) return;

    // Optimistic — update badge immediately
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: "all" }),
      });
    } catch {
      // silent — will re-sync on next poll
    }
  }

  // ── Navigate to notification link ────────────────────────────────────────
  function handleNotifClick(notif: NotificationItem) {
    handleCloseNotifications();
    if (notif.link) router.push(notif.link);
  }

  // ── List Property ─────────────────────────────────────────────────────────
  function handleListProperty() {
    if (!user) { router.push("/signin"); return; }
    if (user.role !== "agent") { setModal("corper-switch"); return; }
    if (!user.agentVerified)  { setModal("agent-kyc");     return; }
    router.push("/agent");
  }

  function handleModalConfirm() {
    setModal(null);
    if (modal === "corper-switch") router.push("/role");
    else if (modal === "agent-kyc") router.push("/agent/kyc");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* ── TOP NAV ── */}
      <header
        className="sticky top-0 z-50 px-4"
        style={{ backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)", height: 56, display: "flex", alignItems: "center" }}
      >
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">

          {/* Logo */}
         <Link href="/home" style={{ textDecoration: "none", flexShrink: 0 }}>
  <img
    src="/corperNestLogo.png"
    alt="CorperNest"
    style={{ height: 32, width: "auto", display: "block" }}
  />
</Link>

          <div style={{ flex: 1 }} />

          {/* List Property */}
          <button
            onClick={handleListProperty}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12, backgroundColor: "var(--color-primary)", border: "none", cursor: "pointer", flexShrink: 0 }}
          >
            {isVerifiedAgent ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.4 8.26L21 9.27L16.5 13.64L17.77 20.23L12 17.27L6.23 20.23L7.5 13.64L3 9.27L9.6 8.26L12 2Z" fill="white" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}
            <span className="hidden xs:inline sm:inline" style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
              {isVerifiedAgent ? "My Listings" : "List Property"}
            </span>
          </button>

          {/* Bell */}
          <button
            onClick={handleOpenNotifications}
            className="relative flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, backgroundColor: notifOpen ? "var(--color-light)" : "var(--color-bg)", border: "1px solid var(--color-border)", flexShrink: 0, cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="var(--color-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Badge — only show when there are unread */}
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold"
                style={{
                  minWidth: unreadCount > 9 ? 18 : 16,
                  height: unreadCount > 9 ? 18 : 16,
                  fontSize: 9,
                  backgroundColor: "#E53935",
                  color: "#fff",
                  padding: "0 3px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar — desktop */}
          <div className="hidden md:block"><UserAvatar /></div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[{ label: "Watchlist", href: "/watchlist" }, { label: "Bookings", href: "/bookings" }].map((item) => (
              <Link key={item.href} href={item.href} style={{ padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: pathname === item.href ? 600 : 400, color: pathname === item.href ? "var(--color-primary)" : "var(--color-text-secondary)", textDecoration: "none" }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── NOTIFICATION DROPDOWN ── */}
        {notifOpen && (
          <>
            {/* Click-outside backdrop */}
            <div
              onClick={handleCloseNotifications}
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
            />
            <div
              className="absolute shadow-lg"
              style={{
                top: "calc(100% + 8px)",
                right: 16,
                width: "min(360px, calc(100vw - 32px))",
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 18,
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--color-header)", margin: 0 }}>
                  Notifications
                </p>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={() => {
                      setUnreadCount(0);
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      fetch("/api/notifications/mark-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: "all" }),
                      });
                    }}
                    style={{ fontSize: 12, color: "var(--color-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifsLoading ? (
                  // Skeleton
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-light)", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 12, borderRadius: 6, background: "var(--color-light)", marginBottom: 6, width: "60%" }} />
                          <div style={{ height: 10, borderRadius: 6, background: "var(--color-light)", width: "85%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center" }}>
                    {/* Empty bell illustration */}
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                          stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-heading)", margin: "0 0 4px" }}>
                      All caught up
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif, i) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 16px",
                          background: notif.read ? "transparent" : "var(--color-light)",
                          borderBottom: i < notifications.length - 1 ? "1px solid var(--color-border)" : "none",
                          border: "none",
                          cursor: notif.link ? "pointer" : "default",
                          textAlign: "left",
                        }}
                      >
                        <NotifIcon type={notif.type} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: notif.read ? 500 : 700, color: "var(--color-header)", fontFamily: "var(--font-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 4 }}>
                            {notif.message}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
                            {timeAgo(notif.createdAt)}
                          </p>
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
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2"
        style={{ backgroundColor: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-4 py-1">
                {item.icon(active)}
                <span className="text-xs" style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)", fontFamily: "var(--font-body)", fontWeight: active ? 600 : 400 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── LIST PROPERTY MODAL ── */}
      <ListPropertyModal type={modal} onClose={() => setModal(null)} onConfirm={handleModalConfirm} />
        <CustomerCare />
    </div>
  );
}