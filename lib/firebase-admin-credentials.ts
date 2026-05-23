/** Normalize a service-account private key from .env / Vercel (often mangled). */
export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  for (let i = 0; i < 2; i++) {
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1).trim();
    }
  }

  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  // PEM pasted as one line (no real newlines)
  if (key.includes("-----BEGIN") && !key.includes("\n")) {
    const beginMatch = key.match(/-----BEGIN ([^-]+)-----/);
    const label = beginMatch?.[1] ?? "PRIVATE KEY";
    const beginMarker = `-----BEGIN ${label}-----`;
    const endMarker = `-----END ${label}-----`;
    const start = key.indexOf(beginMarker);
    const end = key.indexOf(endMarker);
    if (start >= 0 && end > start) {
      const body = key.slice(start + beginMarker.length, end).replace(/\s+/g, "");
      const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
      key = `${beginMarker}\n${wrapped}\n${endMarker}`;
    }
  }

  return key;
}

export type FirebaseAdminEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export function readFirebaseAdminEnv(): FirebaseAdminEnv | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonRaw) {
    try {
      const json = JSON.parse(jsonRaw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      const projectId = json.project_id?.trim();
      const clientEmail = json.client_email?.trim();
      const privateKey = json.private_key
        ? normalizePrivateKey(json.private_key)
        : "";
      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey };
      }
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKeyRaw),
  };
}

export function firebaseAdminConfigCode(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("Firebase Admin not configured")) return "missing_env";
  if (
    message.includes("private key") ||
    message.includes("DECODER routines") ||
    message.includes("PEM")
  ) {
    return "invalid_private_key";
  }
  if (message.includes("JSON")) return "invalid_json";
  return "init_failed";
}
