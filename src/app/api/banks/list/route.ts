// src/app/api/banks/list/route.ts
//
// Fetches the live Nigerian bank list from Paystack. Paystack's own data
// contains duplicate bank codes (likely from legacy/merged entries) —
// confirmed via a real React key-collision warning during testing. Since
// two banks sharing a code would behave identically when resolving an
// account anyway, we dedupe by code, keeping the first occurrence.

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
    const raw: { name: string; code: string }[] = data.data ?? [];

    // Dedupe by code — keep the first occurrence of each unique code
    const seen = new Set<string>();
    const banks = raw
      .filter((b) => {
        if (seen.has(b.code)) return false;
        seen.add(b.code);
        return true;
      })
      .map((b) => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks });
  } catch (err) {
    console.error("[banks/list] Failed:", err);
    return NextResponse.json({ error: "Network error fetching bank list" }, { status: 500 });
  }
}