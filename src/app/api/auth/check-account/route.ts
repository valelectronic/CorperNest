import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, phone } = await req.json();

  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
  }

  // ── Phone checked first — matches the SMS-first pattern used everywhere
  // else in the app. If a phone number was provided, that's the priority
  // lookup; email is the fallback identifier, checked only if phone wasn't
  // given or didn't match.
  if (phone) {
    const normalisedPhone = phone.trim();
    console.log("[check-account] checking phone:", normalisedPhone);

    const byPhone = await db
      .select({ id: user.id, email: user.email, phoneNumber: user.phoneNumber, phoneNumberVerified: user.phoneNumberVerified })
      .from(user)
      .where(eq(user.phoneNumber, normalisedPhone))
      .limit(1);

    console.log("[check-account] phone result:", byPhone.length);

    if (byPhone.length > 0) {
      return NextResponse.json({
        exists: true,
        matchedBy: "phone",
        email: byPhone[0].email,
        phoneNumber: byPhone[0].phoneNumber,
        phoneNumberVerified: byPhone[0].phoneNumberVerified,
      });
    }
  }

  if (email) {
    const normalisedEmail = email.toLowerCase().trim();
    console.log("[check-account] checking email:", normalisedEmail);

    const byEmail = await db
      .select({ id: user.id, email: user.email, phoneNumber: user.phoneNumber, phoneNumberVerified: user.phoneNumberVerified })
      .from(user)
      .where(eq(user.email, normalisedEmail))
      .limit(1);

    console.log("[check-account] email result:", byEmail.length);

    if (byEmail.length > 0) {
      return NextResponse.json({
        exists: true,
        matchedBy: "email",
        email: byEmail[0].email,
        phoneNumber: byEmail[0].phoneNumber,
        phoneNumberVerified: byEmail[0].phoneNumberVerified,
      });
    }
  }

  return NextResponse.json({ exists: false });
}