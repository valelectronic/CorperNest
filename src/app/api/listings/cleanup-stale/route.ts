// src/app/api/listings/cleanup-stale/route.ts
//
// Triggered opportunistically (e.g. when an agent opens their dashboard),
// NOT on a schedule. Fire-and-forget from the frontend — the caller
// doesn't need to wait for this or do anything with the response.

import { NextResponse } from "next/server";
import { cleanupStaleListings } from "@/lib/cleaning-stale-listings";

export async function POST() {
  try {
    const result = await cleanupStaleListings();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cleanup-stale] Failed:", err);
    return NextResponse.json({ deleted: 0 });
  }
}