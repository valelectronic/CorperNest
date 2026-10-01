// src/components/section-switcher.tsx
// Persistent section navigation bar — appears on every page in (main) layout.
// Shows which of the three main sections the user is currently in.
// Active section detected automatically from the URL path using usePathname().
//
// How active detection works:
// /marketplace or /marketplace/anything → Market active
// /parkout or /parkout/anything         → Park-Out active
// /home or anything else                → Housing active
//
// This component is placed in layout.tsx below the top nav.
// It is sticky so it stays visible as user scrolls.

"use client";

import { usePathname, useRouter } from "next/navigation";

export default function SectionSwitcher() {
  const pathname = usePathname();
  const router   = useRouter();

  // Detect active section from URL — works on any sub-page
  const active =
    pathname.startsWith("/marketplace") ? "marketplace" :
    pathname.startsWith("/parkout")     ? "parkout"     :
    "housing";

  const tabs: { id: string; label: string; emoji: string; href: string; badge?: boolean }[] = [
    {
      id:    "housing",
      label: "Housing",
      emoji: "🏠",
      href:  "/home",
    },
    {
      id:    "parkout",
      label: "Park-Out & Earn",
      emoji: "💰",
      href:  "/parkout",
      badge: true,
    },
    {
      id:    "marketplace",
      label: "Market",
      emoji: "🛍",
      href:  "/marketplace",
    },
  ];

  return (
    <div style={{
      position:        "sticky",
      top:             56,          // sits directly below the 56px top nav
      zIndex:          40,
      backgroundColor: "var(--color-bg)",
      borderBottom:    "1px solid var(--color-border)",
      padding:         "8px 16px",
    }}>
      {/* Pill container */}
      <div style={{
        display:         "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap:             4,
        backgroundColor: "var(--color-card)",
        border:          "1px solid var(--color-border)",
        borderRadius:    12,
        padding:         3,
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              style={{
                position:        "relative",
                display:         "flex",
                flexDirection:   "column",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             2,
                padding:         "8px 4px",
                borderRadius:    9,
                border:          "none",
                cursor:          "pointer",
                backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                transition:      "background 0.15s",
              }}
            >
              {/* Emoji icon */}
              <span style={{ fontSize: 14, lineHeight: 1 }}>{tab.emoji}</span>

              {/* Label */}
              <span style={{
                fontSize:   10,
                fontWeight: isActive ? 700 : 600,
                color:      isActive ? "#fff" : "var(--color-text-muted)",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                textAlign:  "center",
              }}>
                {tab.label}
              </span>

              {/* Earn badge — only on Park-Out when not active */}
              {tab.badge && !isActive && (
                <span style={{
                  position:        "absolute",
                  top:             3,
                  right:           3,
                  backgroundColor: "#F59E0B",
                  color:           "#fff",
                  fontSize:        7,
                  fontWeight:      800,
                  padding:         "1px 4px",
                  borderRadius:    6,
                  lineHeight:      1.4,
                }}>
                  EARN
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}