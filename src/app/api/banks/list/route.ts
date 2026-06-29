// src/app/api/banks/list/route.ts
//
// Fetches the live Nigerian bank list from Paystack — same account already
// used for payments, no new service needed. This replaces a hardcoded
// list, and importantly gives us each bank's CODE, which is required for
// the account-resolution call right after.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://api.paystack.co/bank?country=nigeria", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Could not load bank list" }, { status: 502 });
    }

    const data = await res.json();
    const banks = (data.data ?? [])
      .map((b: { name: string; code: string }) => ({ name: b.name, code: b.code }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks });
  } catch (err) {
    console.error("[banks/list] Failed:", err);
    return NextResponse.json({ error: "Network error fetching bank list" }, { status: 500 });
  }
}