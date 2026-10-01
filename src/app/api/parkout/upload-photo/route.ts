// src/app/api/parkout/upload-photo/route.ts
// Uploads Park-Out room photos to HOUSING Cloudinary account.
// Open to all logged-in users — not agent-only like /api/upload.
// Accepts up to 5 images per request, max 6MB each.
// Returns array of URLs.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES   = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES  = 6 * 1024 * 1024; // 6MB

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
  }

  const formData = await req.formData();
  const files    = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No images provided." }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ error: "Maximum 5 images allowed." }, { status: 400 });
  }

  // Validate all files before uploading
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `"${file.name}" is not supported. Use JPEG, PNG or WebP.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 6MB limit.` },
        { status: 400 }
      );
    }
  }

  // Upload to housing Cloudinary account
  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return uploadToCloudinary(buffer, "corpernest/parkout-listings");
      })
    );
    return NextResponse.json({ success: true, urls });
  } catch (err) {
    console.error("[parkout/upload-photo] Cloudinary error:", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}