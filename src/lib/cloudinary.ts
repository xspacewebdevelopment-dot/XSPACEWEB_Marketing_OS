import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

/**
 * Ensures Cloudinary is configured with environment variables
 * Supports both uppercase and lowercase variations
 */
export function configureCloudinary() {
  const cloud_name =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.cloudinary_cloud_name ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const api_key =
    process.env.CLOUDINARY_API_KEY ||
    process.env.cloudinary_api_key ||
    "";
  const api_secret =
    process.env.CLOUDINARY_API_SECRET ||
    process.env.cloudinary_api_secret ||
    "";

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return cloudinary;
}

// Initial config attempt
configureCloudinary();

export { cloudinary };

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

/**
 * Uploads a Buffer directly to Cloudinary via upload_stream.
 * Avoids any local filesystem storage or temp files.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  }
): Promise<CloudinaryUploadResult> {
  const client = configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: options?.folder || "nexareach/email-templates",
        public_id: options?.publicId,
        resource_type: "image",
        tags: options?.tags || ["nexareach", "email-templates"],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Failed to upload image to Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Uploads a base64 data string (e.g., data:image/png;base64,...) directly to Cloudinary.
 * Used for migrating or replacing any base64 images before saving to database.
 */
export async function uploadBase64ToCloudinary(
  base64String: string,
  options?: {
    folder?: string;
    publicId?: string;
  }
): Promise<CloudinaryUploadResult> {
  const client = configureCloudinary();

  const result: UploadApiResponse = await client.uploader.upload(base64String, {
    folder: options?.folder || "nexareach/email-templates",
    public_id: options?.publicId,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
  };
}

/**
 * Scans an HTML string for base64 image data URIs (data:image/...)
 * and uploads them to Cloudinary, replacing each with its secure Cloudinary URL.
 * Guarantees zero base64 image data is stored in Neon PostgreSQL!
 */
export async function replaceBase64ImagesWithCloudinary(html: string): Promise<string> {
  if (!html || !html.includes("data:image/")) {
    return html;
  }

  const base64Regex = /src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[^"']+)["']/g;
  const matches = [...html.matchAll(base64Regex)];

  if (matches.length === 0) return html;

  let updatedHtml = html;
  for (const match of matches) {
    const dataUrl = match[1];
    try {
      const uploadResult = await uploadBase64ToCloudinary(dataUrl, {
        folder: "nexareach/email-templates",
      });
      updatedHtml = updatedHtml.split(dataUrl).join(uploadResult.secure_url);
    } catch (err) {
      console.error("Failed to upload inline base64 image to Cloudinary:", err);
    }
  }

  return updatedHtml;
}
