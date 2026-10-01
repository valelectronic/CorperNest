 // src/app/api/admin/parkout/ambassadors/revoke/route.ts
// Revokes an ambassador — sets isActive to false.
// Any listings assigned to them remain but show "No active ambassador".
// Admin must reassign those listings manually.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassador } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ambassadorId, reason } = await req.json();
  if (!ambassadorId) return NextResponse.json({ error: "Ambassador ID required." }, { status: 400 });

  const [ambassador] = await db
    .select({ id: parkoutAmbassador.id, userId: parkoutAmbassador.userId, lga: parkoutAmbassador.lga })
    .from(parkoutAmbassador)
    .where(eq(parkoutAmbassador.id, ambassadorId))
    .limit(1);

  if (!ambassador) return NextResponse.json({ error: "Ambassador not found." }, { status: 404 });

  await db.update(parkoutAmbassador)
    .set({ isActive: false, status: "suspended", updatedAt: new Date() })
    .where(eq(parkoutAmbassador.id, ambassadorId));

  await createNotification({
    userId:  ambassador.userId,
    type:    "parkout-ambassador-revoked",
    title:   "Ambassador status update",
    message: reason?.trim()
      ? `Your CorperNest Ambassador status for ${ambassador.lga} has been suspended. Reason: ${reason}`
      : `Your CorperNest Ambassador status for ${ambassador.lga} has been suspended. Contact support for more information.`,
    link:    "/parkout",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}