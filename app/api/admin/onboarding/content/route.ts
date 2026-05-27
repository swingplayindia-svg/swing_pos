import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import {
  fetchOnboardingScreenContentAdmin,
  setOnboardingScreenContentAdmin,
} from "@/lib/onboarding-content-admin";
import { normalizeScreenContent } from "@/lib/onboarding-content-schema";

export async function GET(request: Request) {
  try {
    await requireCmsAdmin(request);
    const url = new URL(request.url);
    const screenKey = String(url.searchParams.get("screenKey") ?? "").trim();
    if (!screenKey) {
      return NextResponse.json({ error: "Missing screenKey." }, { status: 400 });
    }
    const content = await fetchOnboardingScreenContentAdmin(screenKey);
    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/onboarding/content GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load content." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCmsAdmin(request);
    const body = (await request.json()) as { screenKey?: string; content?: unknown };
    const screenKey = String(body.screenKey ?? "").trim();
    if (!screenKey) {
      return NextResponse.json({ error: "Missing screenKey." }, { status: 400 });
    }
    const normalized = normalizeScreenContent(body.content);
    await setOnboardingScreenContentAdmin(screenKey, normalized);
    return NextResponse.json({ content: normalized });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/onboarding/content PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed." },
      { status: 500 },
    );
  }
}

