import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file     = formData.get("receipt") as File | null;

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type))
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP or PDF files are accepted" },
        { status: 400 }
      );

    // Max 5MB
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      );

    const buffer     = Buffer.from(await file.arrayBuffer());
    const receiptUrl = await uploadToCloudinary(buffer, "corpernest/receipts");

    return NextResponse.json({ receiptUrl });
  } catch (err) {
    console.error("[upload-receipt]", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}