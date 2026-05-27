import { NextResponse } from "next/server";
import { AdminApiError, requireCmsAdmin } from "@/lib/admin-api-auth";
import { uploadOnboardingFandomImageAdmin } from "@/lib/firebase-storage-admin";

export async function POST(request: Request) {
  try {
    await requireCmsAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const fandomId = String(form.get("fandomId") ?? "").trim();

    if (!fandomId) {
      return NextResponse.json({ error: "Missing fandomId." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
    }

    const url = await uploadOnboardingFandomImageAdmin(file, fandomId);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AdminApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/onboarding/fandoms/image POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 },
    );
  }
}

