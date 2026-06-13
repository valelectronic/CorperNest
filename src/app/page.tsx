import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingPageClient from "./landing-client";


// ADD THIS export to src/app/page.tsx — paste above the default export

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CorperNest — Verified Housing in Akwa Ibom and Beyond | No Scams",
  description:
    "Find verified houses for rent and buy in Eket, uyo and the whole nigeria states. Pay ₦5,000 once, tour with a verified agent, and move in with confidence. NYSC corper accommodation made safe.",
  alternates: {
    canonical: "https://www.corpernest.com.ng",
  },
  openGraph: {
    title:       "CorperNest — Verified Housing in Akwa Ibom",
    description: "Find verified houses for rent and buy in Eket. Pay ₦5,000 to tour with a verified agent. No scams. Built for NYSC corpers and young professionals.",
    url:         "https://www.corpernest.com.ng",
    images: [{
      url:    "/og-image.png",
      width:  1200,
      height: 630,
      alt:    "CorperNest — Verified Housing in Akwa Ibom",
    }],
  },
};

export default async function LandingPage() {
  // If user already has a valid session, send them straight to /home
  // No reason for a logged-in corper to see the marketing page
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/home");

  return <LandingPageClient />;
}