// src/app/api/admin/bookings/decline/route.ts
//
// Admin declines a pending booking request.
// Notifies the client with the reason so they understand what happened.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingRequest } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: { requestId?: string; reason?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { requestId, reason } = body;
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const [request] = await db
    .select()
    .from(bookingRequest)
    .where(eq(bookingRequest.id, requestId))
    .limit(1);

  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 409 });

  const declineReason = reason?.trim() ||
    "We were unable to confirm your visit at this time. Please try booking again.";

  await db
    .update(bookingRequest)
    .set({ status: "declined", declineReason })
    .where(eq(bookingRequest.id, requestId));

  await createNotification({
    userId:  request.clientId,
    type:    "booking-declined",
    title:   "Inspection request not confirmed",
    message: declineReason,
    link:    "/home",
  });

  return NextResponse.json({ success: true });
}