import { randomUUID } from "crypto";
import { getAdminBucket } from "@/lib/firebase-admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFor(contentType: string, fileName?: string): string {
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function firebaseDownloadUrl(
  bucketName: string,
  objectPath: string,
  token: string,
): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

export async function uploadSportScoringImageAdmin(
  file: File,
  sportKey: string,
): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("Please upload a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext = extensionFor(contentType, file.name);
  const objectPath = `sports-scoring/${sportKey}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const downloadToken = randomUUID();
  const bucket = getAdminBucket();

  await bucket.file(objectPath).save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        uploadedAt: new Date().toISOString(),
        sportKey,
      },
    },
  });

  return firebaseDownloadUrl(bucket.name, objectPath, downloadToken);
}
