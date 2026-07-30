// src/app/api/marketplace/seller-status/route.ts
// Returns the current user's saved marketplace bank details
// Called on mount of the new listing form — skips bank verification
// if the user already verified in a previous listing

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ marketSellerVerified: false });
  }

  const [u] = await db
    .select({
      marketSellerVerified: user.marketSellerVerified,
      marketAccountName:    user.marketAccountName,
      marketAccountNumber:  user.marketAccountNumber,
      marketBankCode:       user.marketBankCode,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  return NextResponse.json(u ?? { marketSellerVerified: false });
}