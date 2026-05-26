import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import { listPushTokenUsersForAdmin } from "@/lib/push-notification-admin";

/** GET — list registered device tokens (RTDB + Firestore users.fcmToken). */
export async function GET(request: Request) {
  try {
    await requireCmsAdmin(request);
    const users = await listPushTokenUsersForAdmin();

    return NextResponse.json({
      count: users.length,
      users,
    });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/push-tokens]", err);
    return NextResponse.json(
      { error: "Failed to load push tokens." },
      { status: 500 },
    );
  }
}
