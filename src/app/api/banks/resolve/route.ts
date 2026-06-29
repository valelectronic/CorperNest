// src/app/api/banks/resolve/route.ts
//
// Given a bank code + account number, asks Paystack to confirm the real
// account holder's name. This is what replaces a manually-typed account
// name — an agent can no longer enter a name that doesn't actually match
// the account, since we never accept a typed name at all anymore.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("accountNumber");
  const bankCode       = searchParams.get("bankCode");

  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "accountNumber and bankCode are required" }, { status: 400 });
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const data = await res.json();

    if (!res.ok || !data.status) {
      return NextResponse.json(
        { error: data.message ?? "Could not verify this account. Check the details and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
    });
  } catch (err) {
    console.error("[banks/resolve] Failed:", err);
    return NextResponse.json({ error: "Network error verifying account. Try again." }, { status: 500 });
  }
}