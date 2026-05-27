import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import {
  deleteFandomAdmin,
  fetchOnboardingFandomsAdmin,
  upsertFandomAdmin,
} from "@/lib/onboarding-content-admin";

export async function GET(request: Request) {
  try {
    await requireCmsAdmin(request);
    const fandoms = await fetchOnboardingFandomsAdmin();
    return NextResponse.json({ fandoms });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/onboarding/fandoms GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load fandoms." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCmsAdmin(request);
    const body = (await request.json()) as
      | {
          action: "upsert";
          fandomId: string;
          patch: { name?: string; imageUrl?: string; enabled?: boolean; order?: number };
        }
      | { action: "delete"; fandomId: string };

    if (body.action === "delete") {
      await deleteFandomAdmin(body.fandomId);
      return NextResponse.json({ fandoms: await fetchOnboardingFandomsAdmin() });
    }

    if (body.action === "upsert") {
      const fandomId = String(body.fandomId ?? "").trim();
      if (!fandomId) {
        return NextResponse.json({ error: "Missing fandomId." }, { status: 400 });
      }
      await upsertFandomAdmin(fandomId, body.patch ?? {});
      return NextResponse.json({ fandoms: await fetchOnboardingFandomsAdmin() });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/onboarding/fandoms PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed." },
      { status: 500 },
    );
  }
}

