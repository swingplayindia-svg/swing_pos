/** Normalize ownerIds from Firestore (array, CSV string, or single UID). */
export function parseOwnerIdsField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,;\s]+/)
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
}

export function ownerIdsInclude(raw: unknown, uid: string): boolean {
  return parseOwnerIdsField(raw).includes(uid.trim());
}
