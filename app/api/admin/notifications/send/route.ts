import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import {
  PushNotificationError,
  sendAdminPush,
  type PushTarget,
} from "@/lib/push-notification-admin";

export async function POST(request: Request) {
  try {
    const admin = await requireCmsAdmin(request);
    const body = (await request.json()) as {
      title?: string;
      body?: string;
      target?: PushTarget;
      userId?: string;
      notificationType?: string;
      deepLinkType?: string;
      conversationId?: string;
      inviteId?: string;
    };

    const result = await sendAdminPush(
      {
        title: body.title ?? "",
        body: body.body ?? "",
        target: body.target ?? "all",
        userId: body.userId,
        notificationType: body.notificationType,
        deepLinkType: body.deepLinkType,
        conversationId: body.conversationId,
        inviteId: body.inviteId,
      },
      admin.uid,
    );

    if (result.sent === 0 && result.failed > 0) {
      const pushError =
        result.errors.find((e) => !e.startsWith("in-app ")) ??
        result.errors[0];
      console.error("[admin/notifications/send] all push failed", result.errors);
      return NextResponse.json(
        {
          ok: false,
          ...result,
          error:
            pushError ??
            "Push delivery failed for all devices. In-app notifications may still have been written.",
        },
        { status: 502 },
      );
    }

    if (result.failed > 0) {
      return NextResponse.json({ ok: true, partial: true, ...result });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof PushNotificationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/notifications/send]", err);
    const message =
      err instanceof Error ? err.message : "Failed to send notification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
