// src/app/api/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notification } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";

// POST { ids: string[] }  — mark specific notifications as read
// POST { ids: "all" }     — mark all as read
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { ids } = body ?? {};

  if (!ids) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  if (ids === "all") {
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.read, false)
        )
      );
  } else if (Array.isArray(ids) && ids.length > 0) {
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, session.user.id),
          inArray(notification.id, ids)
        )
      );
  }

  return NextResponse.json({ ok: true });
}