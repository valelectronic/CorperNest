// src/app/(main)/parkout/explore/page.tsx
// Park-Out explore feed — server component.
// No auth required — guests can browse listings.

import type { Metadata } from "next";
import ExploreClient from "./explore-client";

export const metadata: Metadata = {
  title: "Browse Rooms | CorperNest Park-Out & Earn",
  description: "Browse verified rooms from outgoing tenants. Pay a small inspection fee and move in faster.",
};

export default function ParkOutExplorePage() {
  return <ExploreClient />;
}