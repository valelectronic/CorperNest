"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function UserAvatar() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div
        className="shrink-0 w-10 h-10 rounded-xl animate-pulse"
        style={{ backgroundColor: "var(--color-light)" }}
      />
    );
  }

  const initial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : "U";

  const imageUrl = session?.user?.image ?? null;

  return (
    <Link
      href="/profile"
      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl font-bold text-white text-sm overflow-hidden"
      style={{
        backgroundColor: imageUrl ? "transparent" : "var(--color-primary)",
        fontFamily: "var(--font-heading)",
        border: "1px solid var(--color-border)",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </Link>
  );
}