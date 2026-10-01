// src/app/(main)/parkout/page.tsx
// Park-Out & Earn landing page.
// Shows the concept, how it works, and CTAs.
// Listings feed will be added here once the feature is fully built.

import type { Metadata } from "next";
import ParkOutClient from "./parkout-client";

export const metadata: Metadata = {
  title: "Park-Out & Earn | CorperNest",
  description: "Moving out? Earn ₦10,000–₦40,000 handing over your room to the next tenant on CorperNest.",
};

export default function ParkOutPage() {
  return <ParkOutClient />;
}