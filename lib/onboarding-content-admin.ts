import { getAdminRtdb } from "@/lib/firebase-admin";
import {
  normalizeFandoms,
  normalizeScreenContent,
  type OnboardingFandom,
  type OnboardingScreenContent,
} from "@/lib/onboarding-content-schema";

const FANDOMS_PATH = "onboarding_fandoms";
const CONTENT_PATH = "onboarding_content";

function fandomsRef() {
  return getAdminRtdb().ref(FANDOMS_PATH);
}

function contentRef() {
  return getAdminRtdb().ref(CONTENT_PATH);
}

export async function fetchOnboardingFandomsAdmin(): Promise<OnboardingFandom[]> {
  const snap = await fandomsRef().get();
  return normalizeFandoms(snap.val());
}

export async function upsertFandomAdmin(
  fandomId: string,
  patch: Partial<Omit<OnboardingFandom, "id">>,
): Promise<void> {
  const current = await fandomsRef().child(fandomId).get();
  const base = (current.val() ?? {}) as Record<string, unknown>;
  const next = {
    name: typeof patch.name === "string" ? patch.name : (base.name as string) ?? "",
    imageUrl: typeof patch.imageUrl === "string" ? patch.imageUrl : (base.imageUrl as string) ?? "",
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : (base.enabled as boolean) ?? true,
    order: typeof patch.order === "number" ? patch.order : (base.order as number) ?? 0,
    updatedAt: Date.now(),
  };
  await fandomsRef().child(fandomId).set(next);
}

export async function deleteFandomAdmin(fandomId: string): Promise<void> {
  await fandomsRef().child(fandomId).remove();
}

export async function fetchOnboardingScreenContentAdmin(
  screenKey: string,
): Promise<OnboardingScreenContent> {
  const snap = await contentRef().child(screenKey).get();
  return normalizeScreenContent(snap.val());
}

export async function setOnboardingScreenContentAdmin(
  screenKey: string,
  content: OnboardingScreenContent,
): Promise<void> {
  await contentRef().child(screenKey).set({
    title: content.title,
    subtitle: content.subtitle,
    options: content.options.map((o) => ({
      id: o.id,
      title: o.title,
      subtitle: o.subtitle,
      imageUrl: o.imageUrl,
    })),
    updatedAt: Date.now(),
  });
}

