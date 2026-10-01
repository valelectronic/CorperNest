// src/app/api/parkout/delete-photo/route.ts
// Deletes a Park-Out room photo from Cloudinary housing account.
// Called when user taps the X button on an uploaded photo.
// Extracts the public_id from the Cloudinary URL and destroys it.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// Use the housing Cloudinary account credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(url: string): string | null {
  // Cloudinary URL format:
  // https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
  try {
    const parts  = url.split("/upload/");
    if (parts.length < 2) return null;
    // Remove version prefix (v1234567890/) if present
    const path   = parts[1].replace(/^v\d+\//, "");
    // Remove file extension
    const noExt  = path.replace(/\.[^/.]+$/, "");
    return noExt;
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
  if (!url) {
    return NextResponse.json({ error: "No URL provided." }, { status: 400 });
  }

  const publicId = extractPublicId(url);
  if (!publicId) {
    return NextResponse.json({ error: "Could not extract public ID from URL." }, { status: 400 });
  }

  // Only allow deletion of parkout-listings folder
  if (!publicId.startsWith("corpernest/parkout-listings")) {
    return NextResponse.json({ error: "Cannot delete this image." }, { status: 403 });
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[parkout/delete-photo] Cloudinary error:", err);
    return NextResponse.json({ error: "Delete failed. Try again." }, { status: 500 });
  }
}