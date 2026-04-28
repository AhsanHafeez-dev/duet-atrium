import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_FORMATS = ["pdf", "docx", "pptx", "zip"];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Generate signed upload params (in-memory, <100ms)
// Client uploads directly to Cloudinary — no bytes pass through Vercel
export function generateSignedUploadParams(folder: string): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  allowed_formats: string;
  max_file_size: number;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    allowed_formats: ALLOWED_FORMATS.join(","),
    max_file_size: MAX_BYTES,
  };
}

// Delete a file from Cloudinary by public_id (for admin clean-up)
export async function deleteCloudinaryFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// Upload a Base64 image to Cloudinary (backend only)
export async function uploadBase64Image(base64String: string, folder: string = "profiles"): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      resource_type: "image",
      transformation: [{ width: 500, height: 500, crop: "limit" }]
    });
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary Upload Error]", error);
    throw new Error("Failed to upload image");
  }
}

// Upload a Base64 Document/Raw file to Cloudinary (backend only)
export async function uploadBase64Document(base64String: string, folder: string = "proposals"): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      allowed_formats: ["pdf", "docx", "pptx", "zip"],
      resource_type: "auto", // Works around strict raw vs image boundaries for data URIs
    });
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary Upload Error]", error);
    throw new Error("Failed to upload document");
  }
}
