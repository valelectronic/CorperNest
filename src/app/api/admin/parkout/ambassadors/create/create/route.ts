// src/app/api/admin/parkout/ambassadors/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { parkoutAmbassador } from "@/db/schema";
import { nanoid } from "nanoid";
import { createNotification } from "@/lib/create-notification";

const ADMIN_EMAIL = "corpernestng@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, territoryState, territoryLga, bankCode, accountNumber, accountName } = await req.json();

  if (!userId || !territoryState || !territoryLga) {
    return NextResponse.json({ error: "User, state and LGA are required." }, { status: 400 });
  }

  await db.insert(parkoutAmbassador).values({
    id:            `amb_${nanoid(10)}`,
    userId,
    state:         territoryState,   // ← correct column name
    lga:           territoryLga,     // ← correct column name
    bankCode:      bankCode      ?? "",
    accountNumber: accountNumber ?? "",
    accountName:   accountName   ?? "",
    isActive:      true,             // ← correct column name
    totalDeals:    0,                // ← correct column name
    totalEarned:   0,
    status:        "active",
    createdAt:     new Date(),
    updatedAt:     new Date(),
  });

  await createNotification({
    userId,
    type:    "parkout-ambassador-approved",
    title:   "You are now a CorperNest Ambassador 🎉",
    message: `You have been assigned as a Location Ambassador for ${territoryLga}, ${territoryState}. Check your Ambassador Portal to get started.`,
    link:    "/parkout/ambassador",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}