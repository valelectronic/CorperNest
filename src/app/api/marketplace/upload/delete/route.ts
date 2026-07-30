// src/app/api/marketplace/upload/delete/route.ts
// Deletes a single image from the marketplace Cloudinary account
// Called when seller taps X on an uploaded photo

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key:    process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required." }, { status: 400 });

  const publicId = extractPublicId(url);
  if (!publicId) return NextResponse.json({ error: "Invalid URL." }, { status: 400 });

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[marketplace/upload/delete]", err);
    return NextResponse.json({ error: "Could not delete image." }, { status: 500 });
  }
}