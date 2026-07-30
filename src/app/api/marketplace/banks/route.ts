// src/app/api/marketplace/banks/route.ts
// Fetches Nigerian bank list from Paystack with correct codes
// Deduplicates by code — Paystack sometimes returns the same code twice
// Cached in memory for 24 hours — no repeated Paystack calls

import { NextResponse } from "next/server";

type Bank = { name: string; code: string };

let banksCache:    Bank[] = [];
let banksCachedAt: number = 0;
const CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  if (banksCache.length && Date.now() - banksCachedAt < CACHE_MS) {
    return NextResponse.json({ banks: banksCache });
  }

  try {
    const res  = await fetch(
      "https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100",
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await res.json();

    if (!res.ok || !data.data) {
      return NextResponse.json({ banks: banksCache });
    }

    // Deduplicate by code — keep first occurrence of each code
    const seen = new Set<string>();
    banksCache = (data.data as { name: string; code: string }[])
      .filter(({ code }) => {
        if (seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map(({ name, code }) => ({ name, code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    banksCachedAt = Date.now();
    return NextResponse.json({ banks: banksCache });
  } catch {
    return NextResponse.json({ banks: banksCache });
  }
}