// src/app/api/marketplace/price-check/route.ts
// Claude Haiku — estimates new price from training data for Nigerian market
// Shown to seller as a reference with Google verify link
// Stored with listing so buyers see it without extra API calls
// Cost: ~$0.001 per check ($8.55 credit lasts ~6 months at pilot scale)

import { NextRequest, NextResponse } from "next/server";

export type AIPriceResult = {
  newMin:      number;  // naira
  newMax:      number;  // naira
  usedMin:     number | null;
  usedMax:     number | null;
  priceSource: string;
  googleUrl:   string;
  context:     string;
};

const cache    = new Map<string, { data: AIPriceResult; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title       = searchParams.get("title")?.trim()       ?? "";
  const category    = searchParams.get("category")?.trim()    ?? "";
  const condition   = searchParams.get("condition")?.trim()   ?? "";
  const brand       = searchParams.get("brand")?.trim()       ?? "";
  const itemAge     = searchParams.get("itemAge")?.trim()      ?? "";
  const imageUrl    = searchParams.get("imageUrl")?.trim()     ?? "";
  const listingType = searchParams.get("listingType")?.trim()  ?? "single";
  const bundleItems = searchParams.get("bundleItems")?.trim()  ?? "";

  if (!title || !category) {
    return NextResponse.json({ error: "Title and category required" }, { status: 400 });
  }

  const cacheKey = `${listingType}__${title}__${bundleItems}__${condition}__${brand}__${itemAge}__${imageUrl ? "img" : "noimg"}`.toLowerCase();
  const cached   = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ result: cached.data, cached: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Price check not configured" }, { status: 500 });
  }

  try {
    const details = [
      `Item name: ${title}`,
      brand   ? `Brand: ${brand}`                    : null,
      `Category: ${category}`,
      `Condition: ${condition}`,
      itemAge ? `How long owned: ${itemAge}`          : null,
    ].filter(Boolean).join("\n");

    const bundleList = listingType === "bundle" && bundleItems
      ? bundleItems.split(",").map((s, i) => `${i + 1}. ${s.trim()}`).filter(Boolean).join("\n")
      : "";

    const isBundle = listingType === "bundle" && bundleList;

    const imageNote = imageUrl
      ? `A photo is provided. Use it to identify the exact model, variant, and condition.
If the photo shows a different item than the text description, trust the PHOTO.
Do not mention any discrepancy — silently use what the photo shows.`
      : "";

    const prompt = `You are a Nigerian electronics and goods pricing expert.
${imageNote}

${isBundle
  ? `Estimate the current NEW price of each item in this bundle in Nigeria:\n${bundleList}\nOverall condition: ${condition}`
  : `Using ALL of the following details together, estimate the current price of this item in Nigeria:

${details}

Use the brand, age, and condition together — for example a 1-year-old Apple iPad in fairly-used condition should give a specific used price range, not a generic estimate.`}

Nigerian market context (2026):
- Exchange rate: ~₦1,600 per $1 USD
- Electronics carry 20 - 35% import duty in Nigeria
- Nigerian retail prices are much higher than international prices
- Use your knowledge of what these items actually sell for in Nigeria today

Use ONLY these trusted Nigerian stores for priceSource:
- Jumia Nigeria (jumia.com.ng) — most trusted, accurate new prices
- Konga (konga.com) — accurate new prices
- Slot.ng — accurate for electronics and appliances

Do NOT reference Jiji, Tonaton, OLX or any classifieds site — their prices are unreliable.

Return ONLY valid JSON. No text before or after:
${isBundle ? `{
  "newMin": 43000,
  "newMax": 95000,
  "usedMin": null,
  "usedMax": null,
  "priceSource": "Jumia Nigeria, Konga",
  "context": "One sentence about buying these items new in Nigeria (max 15 words)"
}` : `{
  "newMin": 640000,
  "newMax": 800000,
  "usedMin": 380000,
  "usedMax": 480000,
  "priceSource": "Jumia Nigeria, Slot.ng",
  "context": "One sentence about this specific item's price in Nigeria (max 15 words)"
}`}

Rules:
- newMin/newMax = current NEW price on Jumia/Konga/Slot in naira
- usedMin/usedMax = realistic USED price for this specific age and condition in naira
- If item is already new condition, set usedMin/usedMax to null
- All prices as plain integers in naira — ONLY return JSON`;

    const userContent = imageUrl
      ? [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: prompt },
        ]
      : prompt;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 9000); // 9s — under Vercel's 10s limit

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system:     "You are a price research assistant. You ONLY respond with valid JSON. Never write any text outside of JSON.",
        messages:   [{ role: "user", content: userContent }],
      }),
    });

    const data = await res.json();
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("[price-check] Anthropic error:", data);
      return NextResponse.json({ error: "Price check failed" }, { status: 500 });
    }

    const text  = (data.content as { type: string; text?: string }[])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();

    console.log("[price-check] Claude:", text.slice(0, 200));

    const start  = text.indexOf("{");
    const end    = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "Could not determine price" });
    }

    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown> & { error?: string };
    if (parsed.error) return NextResponse.json({ error: parsed.error });

    // Google link built from seller's title + brand — accurate search
    const sellerQuery = `${title} ${brand}`.trim();
    const googleUrl   = `https://www.google.com/search?q=${encodeURIComponent(sellerQuery + " price in Nigeria")}`;

    const result: AIPriceResult = {
      newMin:      parsed.newMin      as number,
      newMax:      parsed.newMax      as number,
      usedMin:     (parsed.usedMin    as number | null) ?? null,
      usedMax:     (parsed.usedMax    as number | null) ?? null,
      priceSource: (parsed.priceSource as string) || "Nigerian market estimate",
      googleUrl,
      context:     (parsed.context    as string) || "",
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json({ result, cached: false });

  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[price-check] Failed:", isAbort ? "Timeout after 9s" : err);
    return NextResponse.json({ error: isAbort ? "Price check timed out. Try again." : "Price check failed" }, { status: 500 });
  }
}