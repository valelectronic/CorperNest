// src/app/api/admin/parkout/applications/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassadorApplication, parkoutAmbassador } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId, userId } = await req.json();
  if (!applicationId || !userId) {
    return NextResponse.json({ error: "Application ID and User ID required." }, { status: 400 });
  }

  const [application] = await db
    .select().from(parkoutAmbassadorApplication)
    .where(eq(parkoutAmbassadorApplication.id, applicationId)).limit(1);

  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // Create ambassador using correct column names
  await db.insert(parkoutAmbassador).values({
    id:            `amb_${nanoid(10)}`,
    userId,
    state:         application.territoryState ?? "",  // ← correct column
    lga:           application.territoryLga   ?? "",  // ← correct column
    bankCode:      application.bankCode       ?? "",
    accountNumber: application.accountNumber  ?? "",
    accountName:   application.accountName    ?? "",
    isActive:      true,
    totalDeals:    0,
    totalEarned:   0,
    status:        "active",
    approvedAt:    new Date(),
    createdAt:     new Date(),
    updatedAt:     new Date(),
  });

  // Update application status
  await db.update(parkoutAmbassadorApplication)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(parkoutAmbassadorApplication.id, applicationId));

  await createNotification({
    userId,
    type:    "parkout-ambassador-approved",
    title:   "Application approved 🎉",
    message: `Welcome to the CorperNest Ambassador team! You have been assigned ${application.territoryLga} territory.`,
    link:    "/parkout/ambassador",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}