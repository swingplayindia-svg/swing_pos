import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import {
  fetchSportScoringFlagsAdmin,
  saveAllSportScoringFlagsAdmin,
  seedDefaultSportScoringFlagsAdmin,
  setSportScoringEnabledAdmin,
} from "@/lib/sports-scoring-admin";
import type { SportScoringFlags, SportScoringKey } from "@/lib/sports-scoring-schema";
import { SPORT_SCORING_DEFINITIONS } from "@/lib/sports-scoring-schema";

export async function GET(request: Request) {
  try {
    await requireCmsAdmin(request);
    const flags = await fetchSportScoringFlagsAdmin();
    return NextResponse.json({ flags });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/sports-scoring GET]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load flags.";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCmsAdmin(request);
    const body = (await request.json()) as {
      key?: SportScoringKey;
      enabled?: boolean;
      flags?: SportScoringFlags;
      action?: "seed" | "disableAll";
    };

    if (body.action === "seed") {
      await seedDefaultSportScoringFlagsAdmin();
      const flags = await fetchSportScoringFlagsAdmin();
      return NextResponse.json({ flags });
    }

    if (body.action === "disableAll") {
      const allOff = Object.fromEntries(
        SPORT_SCORING_DEFINITIONS.map((d) => [d.key, false]),
      ) as SportScoringFlags;
      await saveAllSportScoringFlagsAdmin(allOff);
      return NextResponse.json({ flags: allOff });
    }

    if (body.flags) {
      await saveAllSportScoringFlagsAdmin(body.flags);
      return NextResponse.json({ flags: body.flags });
    }

    if (body.key && typeof body.enabled === "boolean") {
      await setSportScoringEnabledAdmin(body.key, body.enabled);
      const flags = await fetchSportScoringFlagsAdmin();
      return NextResponse.json({ flags });
    }

    return NextResponse.json(
      { error: "Provide key+enabled, flags, or action." },
      { status: 400 },
    );
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/sports-scoring PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed." },
      { status: 500 },
    );
  }
}
