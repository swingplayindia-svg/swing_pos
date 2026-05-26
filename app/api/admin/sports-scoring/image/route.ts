import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import { uploadSportScoringImageAdmin } from "@/lib/firebase-storage-admin";
import {
  SPORT_SCORING_DEFINITIONS,
  type SportScoringKey,
} from "@/lib/sports-scoring-schema";

const VALID_KEYS = new Set(
  SPORT_SCORING_DEFINITIONS.map((d) => d.key),
);

export async function POST(request: Request) {
  try {
    await requireCmsAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const sportKey = String(form.get("sportKey") ?? "").trim();

    if (!VALID_KEYS.has(sportKey as SportScoringKey)) {
      return NextResponse.json({ error: "Invalid sport key." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
    }

    const url = await uploadSportScoringImageAdmin(file, sportKey);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/sports-scoring/image POST]", err);
    const message =
      err instanceof Error ? err.message : "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
