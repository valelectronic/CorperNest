// src/hooks/use-fcm.ts
// Initialises Firebase push notifications once user is logged in.
// Saves token to Neon, listens for foreground messages, shows toast.
// Call this from both (main) and (market) layouts — safe to call twice.
"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { initialiseFCM, listenForForegroundMessages } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";

export function useFCM(isLoggedIn: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) return;

    let unsubscribe: (() => void) | undefined;

    async function setup() {
      console.log("[FCM] setup running, isLoggedIn:", isLoggedIn);

      const token = await initialiseFCM();
      console.log("[FCM] token received:", token ? token.slice(0, 20) + "..." : "null");

      if (!token) return;

      // Save token to Neon
      const res = await fetch("/api/fcm/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => null);
      console.log("[FCM] save response:", res?.status);

      // Listen for foreground messages — show as toast with tap-to-navigate
      unsubscribe = listenForForegroundMessages((title, body, link) => {
        toast(body || title, {
          description: body ? title : undefined,
          duration: 6000,
          action: link !== "/"
            ? { label: "View", onClick: () => router.push(link) }
            : undefined,
        });
      });
    }

    setup();
    return () => { unsubscribe?.(); };
  }, [isLoggedIn]);
}