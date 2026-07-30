import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Metadata } from "next";
import LandingPageClient from "./landing-client";

export const metadata: Metadata = {
  title: "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
  description:
    "CorperNest helps Nigerians relocating to new cities find verified scam-free housing and buy or sell items safely via escrow. Verified agents, no fraud, secure payments. Starting in Eket, Akwa Ibom — expanding across Nigeria.",
  alternates: {
    canonical: "https://www.corpernest.com.ng",
  },
  openGraph: {
    title:       "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
    description: "Find verified scam-free housing and buy or sell items safely via escrow. Verified agents, secure payments, no fraud. Starting in Eket, Akwa Ibom.",
    url:         "https://www.corpernest.com.ng",
    images: [{
      url:    "/og-image.png",
      width:  1200,
      height: 630,
      alt:    "CorperNest — Verified Housing & Marketplace for Nigerians Relocating",
    }],
  },
};

export default async function LandingPage() {
  // Logged-in users go straight to /home — no reason to see the marketing page
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");

  return <LandingPageClient />;
}