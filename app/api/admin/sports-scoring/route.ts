import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import {
  disableAllSportScoringAdmin,
  fetchSportScoringAdmin,
  saveAllSportScoringAdmin,
  seedDefaultSportScoringAdmin,
  setSportScoringEnabledAdmin,
  setSportScoringImageUrlAdmin,
} from "@/lib/sports-scoring-admin";
import {
  SPORT_SCORING_DEFINITIONS,
  sportScoringStateToFlags,
  type SportScoringKey,
  type SportScoringState,
} from "@/lib/sports-scoring-schema";

export async function GET(request: Request) {
  try {
    await requireCmsAdmin(request);
    const sports = await fetchSportScoringAdmin();
    return NextResponse.json({
      sports,
      flags: sportScoringStateToFlags(sports),
    });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/sports-scoring GET]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load sport config.";
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
      imageUrl?: string;
      sports?: SportScoringState;
      flags?: Record<SportScoringKey, boolean>;
      action?: "seed" | "disableAll";
    };

    if (body.action === "seed") {
      await seedDefaultSportScoringAdmin();
      const sports = await fetchSportScoringAdmin();
      return NextResponse.json({
        sports,
        flags: sportScoringStateToFlags(sports),
      });
    }

    if (body.action === "disableAll") {
      await disableAllSportScoringAdmin();
      const sports = await fetchSportScoringAdmin();
      return NextResponse.json({
        sports,
        flags: sportScoringStateToFlags(sports),
      });
    }

    if (body.sports) {
      await saveAllSportScoringAdmin(body.sports);
      return NextResponse.json({
        sports: body.sports,
        flags: sportScoringStateToFlags(body.sports),
      });
    }

    if (body.flags) {
      const current = await fetchSportScoringAdmin();
      const next = { ...current };
      for (const def of SPORT_SCORING_DEFINITIONS) {
        if (typeof body.flags[def.key] === "boolean") {
          next[def.key] = { ...next[def.key], enabled: body.flags[def.key] };
        }
      }
      await saveAllSportScoringAdmin(next);
      return NextResponse.json({
        sports: next,
        flags: sportScoringStateToFlags(next),
      });
    }

    if (body.key && typeof body.imageUrl === "string") {
      await setSportScoringImageUrlAdmin(body.key, body.imageUrl);
      const sports = await fetchSportScoringAdmin();
      return NextResponse.json({
        sports,
        flags: sportScoringStateToFlags(sports),
      });
    }

    if (body.key && typeof body.enabled === "boolean") {
      await setSportScoringEnabledAdmin(body.key, body.enabled);
      const sports = await fetchSportScoringAdmin();
      return NextResponse.json({
        sports,
        flags: sportScoringStateToFlags(sports),
      });
    }

    return NextResponse.json(
      {
        error:
          "Provide key+enabled, key+imageUrl, sports, flags, or action.",
      },
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
