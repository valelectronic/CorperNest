import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { booking, review } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { createNotification } from "@/lib/create-notification";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { bookingId?: string; rating?: number; comment?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { bookingId, rating, comment } = body;

  if (!bookingId)
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5)
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });

  if (comment && comment.trim().length > 500)
    return NextResponse.json({ error: "Comment must be under 500 characters" }, { status: 400 });

  // Verify the booking belongs to this client and is verified
  const bookingRows = await db
    .select({ id: booking.id, renterId: booking.renterId, agentId: booking.agentId, status: booking.status })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!bookingRows.length)
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const b = bookingRows[0];

  if (b.renterId !== session.user.id)
    return NextResponse.json({ error: "This is not your booking" }, { status: 403 });

  if (b.status !== "verified")
    return NextResponse.json({ error: "You can only review after your visit is verified" }, { status: 400 });

  // Check if review already exists for this booking
  const existing = await db
    .select({ id: review.id })
    .from(review)
    .where(and(eq(review.bookingId, bookingId), eq(review.reviewerId, session.user.id)))
    .limit(1);

  if (existing.length)
    return NextResponse.json({ error: "You have already reviewed this visit" }, { status: 409 });

  // Insert review
  await db.insert(review).values({
    id:         nanoid(),
    bookingId,
    reviewerId: session.user.id,
    agentId:    b.agentId,
    rating,
    comment:    comment?.trim() ?? null,
    createdAt:  new Date(),
  });

  // Notify agent in-app
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  await createNotification({
    userId:  b.agentId,
    type:    "new-review",
    title:   `New ${rating}-star review`,
    message: `A client rated their visit ${stars}${comment ? `: "${comment.trim().slice(0, 80)}"` : ""}`,
    link:    `/agent/${b.agentId}`,
  });

  return NextResponse.json({ success: true });
}