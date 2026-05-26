import { getAdminAuth, getAdminRtdb } from "@/lib/firebase-admin";

export function bearerTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** Verifies Firebase ID token and cmsAdmins/{uid} === true in RTDB. */
export async function requireCmsAdmin(request: Request): Promise<{
  uid: string;
  email?: string;
}> {
  const token = bearerTokenFromRequest(request);
  if (!token) {
    throw new AdminApiError("Missing Authorization bearer token.", 401);
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new AdminApiError("Invalid or expired auth token.", 401);
  }

  const rtdb = getAdminRtdb();
  const cmsAdminsSnap = await rtdb.ref("cmsAdmins").get();
  const cmsAdminsConfigured =
    cmsAdminsSnap.exists() &&
    cmsAdminsSnap.hasChildren();

  if (!cmsAdminsConfigured) {
    return { uid: decoded.uid, email: decoded.email };
  }

  const adminSnap = await rtdb.ref(`cmsAdmins/${decoded.uid}`).get();

  if (adminSnap.val() !== true) {
    throw new AdminApiError(
      `Your account is not a CMS admin. In Firebase Console → Realtime Database → Data, add cmsAdmins/${decoded.uid} = true (boolean). Your UID is in Settings.`,
      403,
    );
  }

  return { uid: decoded.uid, email: decoded.email };
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
