// src/app/api/marketplace/verify-bank/route.ts
// Verifies a seller's bank account via Paystack resolve API.
// After verification, creates a Paystack Transfer Recipient for automated payouts.
// The recipient_code is saved to the user profile and used when releasing seller payment.
// Seller sees no change — recipient creation happens silently in the background.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountNumber, bankCode } = await req.json();

  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "Account number and bank code are required." }, { status: 400 });
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Account number must be exactly 10 digits." }, { status: 400 });
  }

  // 8-second abort — keeps us under Vercel Hobby's 10s function limit
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 8000);

  try {
    // ── Step 1: Verify account name via Paystack ─────────────────────────────
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        signal:  controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok || !data.data?.account_name) {
      const msg = res.status === 422
        ? "Account not found. Check the account number and bank."
        : data.message ?? "Could not verify account. Check the details and try again.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const accountName = data.data.account_name;

    // ── Step 2: Create Paystack Transfer Recipient ────────────────────────────
    // This registers the seller's bank with Paystack so we can pay them
    // automatically later using just the recipient_code.
    // Fails silently — never blocks the bank verification response.
    try {
      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type:           "nuban",
          name:           accountName,
          account_number: accountNumber,
          bank_code:      bankCode,
          currency:       "NGN",
        }),
      });

      const recipientData = await recipientRes.json();
      const recipientCode = recipientData?.data?.recipient_code;

      if (recipientCode) {
        // Save recipient code to user profile — used when releasing seller payout
        await db.update(user)
          .set({ marketRecipientCode: recipientCode })
          .where(eq(user.id, session.user.id))
          .catch(() => {}); // Silent — never block verification if DB write fails
      }
    } catch {
      // Silent — recipient creation failure never blocks bank verification
      console.error("[verify-bank] Recipient creation failed — payout will need manual processing");
    }

    // ── Step 3: Return account name to frontend ───────────────────────────────
    // Response is identical to before — seller sees no difference
    return NextResponse.json({ accountName });

  } catch (err: unknown) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[marketplace/verify-bank]", err);
    return NextResponse.json(
      { error: isAbort ? "Verification timed out. Try again." : "Verification failed. Try again." },
      { status: 500 }
    );
  }
}