import "server-only";

import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const isPlaceholder = (value?: string) => {
  if (!value) return true;
  const normalized = value.trim().replace(/^['"]|['"]$/g, "");
  return (
    normalized.length === 0 ||
    normalized.toLowerCase() === "your_value_here" ||
    normalized.toLowerCase() === "placeholder"
  );
};

const hasValidCloudinaryConfig = !(
  isPlaceholder(cloudName) ||
  isPlaceholder(apiKey) ||
  isPlaceholder(apiSecret)
);

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "corpernest/listings"
): Promise<string> {
  if (!hasValidCloudinaryConfig) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder?.trim() || "corpernest/listings",
        resource_type: "image",
        // Compress and optimize at storage time — saves Cloudinary quota
        // and ensures every stored image is already web-ready
        quality: "auto:good",      // ~60-80% of original size, no visible loss
        fetch_format: "auto",      // stores as webp where supported, jpeg fallback
        // Cap dimensions — no property photo needs to be wider than 1600px
        transformation: [
          { width: 1600, crop: "limit" }, // shrinks oversized phone photos, never upscales
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload succeeded but no secure_url was returned."));
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}