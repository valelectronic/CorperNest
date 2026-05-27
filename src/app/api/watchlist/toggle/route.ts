// src/app/api/watchlist/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { listingId } = body ?? {};

  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.renterId, session.user.id),
        eq(watchlist.listingId, listingId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .delete(watchlist)
      .where(eq(watchlist.id, existing.id));
    return NextResponse.json({ watching: false });
  }

  await db.insert(watchlist).values({
    id: nanoid(),
    renterId: session.user.id,
    listingId,
    createdAt: new Date(),
  });

  return NextResponse.json({ watching: true });
}