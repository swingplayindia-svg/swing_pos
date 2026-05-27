import { getFirebaseIdToken } from "@/lib/firebase-auth";
import type {
  OnboardingFandom,
  OnboardingScreenContent,
} from "@/lib/onboarding-content-schema";

async function onboardingFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getFirebaseIdToken();
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchFandoms(): Promise<OnboardingFandom[]> {
  const { fandoms } = await onboardingFetch<{ fandoms: OnboardingFandom[] }>(
    "/api/admin/onboarding/fandoms",
  );
  return fandoms;
}

export async function upsertFandom(
  fandomId: string,
  patch: Partial<Omit<OnboardingFandom, "id">>,
): Promise<OnboardingFandom[]> {
  const { fandoms } = await onboardingFetch<{ fandoms: OnboardingFandom[] }>(
    "/api/admin/onboarding/fandoms",
    {
      method: "PATCH",
      body: JSON.stringify({ action: "upsert", fandomId, patch }),
    },
  );
  return fandoms;
}

export async function deleteFandom(fandomId: string): Promise<OnboardingFandom[]> {
  const { fandoms } = await onboardingFetch<{ fandoms: OnboardingFandom[] }>(
    "/api/admin/onboarding/fandoms",
    {
      method: "PATCH",
      body: JSON.stringify({ action: "delete", fandomId }),
    },
  );
  return fandoms;
}

export async function uploadFandomImage(file: File, fandomId: string): Promise<string> {
  const token = await getFirebaseIdToken();
  const form = new FormData();
  form.append("file", file);
  form.append("fandomId", fandomId);

  const res = await fetch("/api/admin/onboarding/fandoms/image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  if (!data.url) throw new Error("Upload succeeded but no URL was returned.");
  return data.url;
}

export async function fetchScreenContent(
  screenKey: string,
): Promise<OnboardingScreenContent> {
  const { content } = await onboardingFetch<{ content: OnboardingScreenContent }>(
    `/api/admin/onboarding/content?screenKey=${encodeURIComponent(screenKey)}`,
  );
  return content;
}

export async function saveScreenContent(
  screenKey: string,
  content: OnboardingScreenContent,
): Promise<OnboardingScreenContent> {
  const { content: saved } = await onboardingFetch<{ content: OnboardingScreenContent }>(
    "/api/admin/onboarding/content",
    {
      method: "PATCH",
      body: JSON.stringify({ screenKey, content }),
    },
  );
  return saved;
}

