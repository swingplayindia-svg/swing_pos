import { NextResponse } from "next/server";
import {
  getFcmAccessToken,
  isFcmCredentialsOkError,
  sendFcmV1Message,
} from "@/lib/fcm-v1-client";
import { readFirebaseAdminEnv } from "@/lib/firebase-admin-credentials";

/** GET — verifies service account can obtain FCM OAuth token and call FCM v1 API. */
export async function GET() {
  const env = readFirebaseAdminEnv();
  if (!env) {
    return NextResponse.json(
      { ok: false, code: "missing_env", projectId: null },
      { status: 503 },
    );
  }

  try {
    await getFcmAccessToken();
    await sendFcmV1Message(
      {
        token: "dry-run-placeholder-token",
        notification: { title: "health", body: "check" },
      },
      { validateOnly: true },
    );
    return NextResponse.json({
      ok: true,
      code: "ok",
      projectId: env.projectId,
      clientEmail: env.clientEmail,
      transport: "fcm-http-v1",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (isFcmCredentialsOkError(message)) {
      return NextResponse.json({
        ok: true,
        code: "ok",
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        transport: "fcm-http-v1",
        note: "OAuth OK; placeholder token rejected as expected.",
      });
    }

    const authError =
      message.includes("authentication credential") ||
      message.includes("OAuth 2") ||
      message.includes("UNAUTHENTICATED");

    return NextResponse.json(
      {
        ok: false,
        code: authError ? "fcm_auth" : "fcm_error",
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        hint: authError
          ? "Enable Firebase Cloud Messaging API and grant Firebase Cloud Messaging Admin to the service account."
          : message,
      },
      { status: 503 },
    );
  }
}
