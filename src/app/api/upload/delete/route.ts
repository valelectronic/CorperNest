// src/app/api/upload/delete/route.ts
//
// Deletes a single image from Cloudinary by URL. Called immediately when
// an agent removes a photo from the listing form — keeps Cloudinary clean
// without waiting for the listing to be submitted or deleted.
//
// Fire-and-forget from the client side: the UI removes the image instantly,
// this route runs in the background. A failure here is not fatal — the
// image just lingers on Cloudinary temporarily, same as the old behaviour.

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract the public_id from a Cloudinary URL
// e.g. https://res.cloudinary.com/dx2rhkfdh/image/upload/v1234/corpernest/listings/abc.jpg
// → corpernest/listings/abc
function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  // Must be a signed-in agent — can't let anonymous callers delete anything
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { url } = body;
  if (!url || !url.includes("cloudinary.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const publicId = extractPublicId(url);
  if (!publicId) {
    return NextResponse.json({ error: "Could not extract public_id from URL" }, { status: 400 });
  }

  // Only allow deletion of listing images — prevent deletion of other assets
  if (!publicId.startsWith("corpernest/listings/")) {
    return NextResponse.json({ error: "Forbidden — only listing images can be deleted here" }, { status: 403 });
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[upload/delete] Cloudinary deletion failed:", err);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}