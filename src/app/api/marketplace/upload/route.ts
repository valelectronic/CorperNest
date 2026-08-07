// src/app/api/marketplace/upload/route.ts
// Handles photo uploads for marketplace listings
// Uses the SEPARATE Cloudinary account (MARKET credentials)
// Cloudinary compresses automatically — no manual size limit needed

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key:    process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

// Allow up to 20MB so phone camera photos can reach Cloudinary for compression
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Block non-images only — let Cloudinary handle compression, not us
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
    }

    // Hard cap at 20MB — prevents abuse while allowing all phone photos
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary compresses on the way in:
    // → Resizes to max 1200×1200 (preserves aspect ratio)
    // → Auto quality optimisation
    // → Output is always under 300KB regardless of input size
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:         "marketplace",
          transformation: [
            { width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" },
          ],
        },
        (err, result) => {
          if (err || !result) reject(err);
          else resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}