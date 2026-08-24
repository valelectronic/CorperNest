// src/app/api/marketplace/upload-id/route.ts
// Handles government ID photo upload for seller KYC compliance.
// Separate from product photo upload — stored in "identity-docs" folder on Cloudinary.
// Only authenticated users can upload.
// Returns the Cloudinary URL — saved to user profile by the listing create route.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// Uses the MARKET Cloudinary account — same as product photos
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_MARKET!,
  api_key:    process.env.CLOUDINARY_API_KEY_MARKET!,
  api_secret: process.env.CLOUDINARY_API_SECRET_MARKET!,
});

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
    }

    // Allow up to 10MB — ID photos from phone cameras can be large
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to identity-docs folder — separate from product photos
    // Compressed but kept readable for admin review
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:         "identity-docs",
          transformation: [
            { width: 1200, height: 800, crop: "limit", quality: "auto:good" },
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