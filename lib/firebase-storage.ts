import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { requireFirebaseUser } from "@/lib/firebase-auth";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadTurfImage(
  file: File,
  folderId: string,
): Promise<string> {
  await requireFirebaseUser();

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please upload a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext = extensionFor(file);
  const path = `turfs/${folderId}/${Date.now()}.${ext}`;
  const storageRef = ref(getFirebaseStorage(), path);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  return getDownloadURL(storageRef);
}

export function isDefaultTurfImage(url: string): boolean {
  return !url || url === "/turf-default.jpg";
}

export async function uploadCarouselImage(
  file: File,
  slideId: string,
): Promise<string> {
  await requireFirebaseUser();

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please upload a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const ext = extensionFor(file);
  const path = `carousels/community/${slideId}/${Date.now()}.${ext}`;
  const storageRef = ref(getFirebaseStorage(), path);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  return getDownloadURL(storageRef);
}
