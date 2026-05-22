import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 6;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(req: NextRequest) {
  // 1. Auth check — only logged in agents can upload
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "agent") {
    return NextResponse.json({ error: "Only agents can upload images" }, { status: 403 });
  }

  // 2. Parse the form data
  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ error: "Maximum 5 images allowed" }, { status: 400 });
  }

  // 3. Validate each file before touching Cloudinary
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.` },
        { status: 400 }
      );
    }
  }

  // 4. Upload each image to Cloudinary
  try {
    const uploadPromises = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return uploadToCloudinary(buffer, "corpernest/listings");
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, urls });

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Image upload failed. Try again." },
      { status: 500 }
    );
  }
}