// src/app/(main)/parkout/new/page.tsx
// Park-Out listing form — server component.
// Auth check only — passes user info to client.
// Redirects to signin if not logged in.

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ParkOutNewClient from "./new-client";

export const metadata: Metadata = {
  title: "List Your Room | CorperNest Park-Out & Earn",
  description: "List your room before vacating and earn ₦9,000–₦30,000 when the next tenant moves in.",
};

export default async function ParkOutNewPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/signin?redirect=/parkout/new");
  }

  return (
    <ParkOutNewClient
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? ""}
      userId={session.user.id}
    />
  );
}