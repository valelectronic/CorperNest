// src/app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notification } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const [result] = await db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.read, false)
        )
      );

    return NextResponse.json(
      { count: Number(result?.count ?? 0) },
      {
        headers: {
          "Cache-Control": "private, max-age=25",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}