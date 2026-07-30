// src/app/api/marketplace/verify-bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
      // Paystack returns 422 when account not found, 400 for bad params
      const msg = res.status === 422
        ? "Account not found. Check the account number and bank."
        : data.message ?? "Could not verify account. Check the details and try again.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ accountName: data.data.account_name });
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