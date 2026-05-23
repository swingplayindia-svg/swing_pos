import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { getRtdb } from "@/lib/firebase";
import { requireFirebaseUser } from "@/lib/firebase-auth";
import {
  buildSlidePayloadFromForm,
  normalizeCommunityCarouselSlide,
  toRtdbSlideData,
  type CommunityCarouselSlide,
  type CommunityCarouselSlideForm,
  type CommunityCarouselSlidePayload,
} from "@/lib/community-carousel-schema";

const COMMUNITY_CAROUSELS_PATH = "Carousels/community";

async function assertAuth(): Promise<void> {
  await requireFirebaseUser();
}

function communityRef() {
  return ref(getRtdb(), COMMUNITY_CAROUSELS_PATH);
}

function slideRef(slideId: string) {
  return ref(getRtdb(), `${COMMUNITY_CAROUSELS_PATH}/${slideId}`);
}

function snapshotToSlides(
  val: Record<string, unknown> | null,
): CommunityCarouselSlide[] {
  if (!val || typeof val !== "object") return [];

  const entries = Object.entries(val).filter(
    ([, v]) => v && typeof v === "object",
  ) as [string, Record<string, unknown>][];

  return entries
    .map(([id, data], index) =>
      normalizeCommunityCarouselSlide(id, data, index),
    )
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export async function fetchCommunityCarouselSlides(): Promise<
  CommunityCarouselSlide[]
> {
  await assertAuth();
  const snapshot = await get(communityRef());
  const val = snapshot.val() as Record<string, unknown> | null;
  return snapshotToSlides(val);
}

export function subscribeCommunityCarouselSlides(
  onSlides: (slides: CommunityCarouselSlide[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onValue(
    communityRef(),
    (snapshot) => {
      const val = snapshot.val() as Record<string, unknown> | null;
      onSlides(snapshotToSlides(val));
    },
    (err) => onError?.(err),
  );
}

export async function fetchCommunityCarouselSlideById(
  slideId: string,
): Promise<CommunityCarouselSlide | undefined> {
  await assertAuth();
  const snapshot = await get(slideRef(slideId));
  if (!snapshot.exists()) return undefined;
  const data = snapshot.val() as Record<string, unknown>;
  return normalizeCommunityCarouselSlide(slideId, data);
}

export async function createCommunityCarouselSlide(
  payload: CommunityCarouselSlidePayload,
): Promise<CommunityCarouselSlide> {
  await assertAuth();
  const newRef = push(communityRef());
  const id = newRef.key;
  if (!id) throw new Error("Failed to generate slide id.");

  await set(newRef, toRtdbSlideData(payload, "create"));
  return { id, ...payload };
}

export async function createCommunityCarouselSlideWithId(
  slideId: string,
  payload: CommunityCarouselSlidePayload,
): Promise<CommunityCarouselSlide> {
  await assertAuth();
  const existing = await fetchCommunityCarouselSlideById(slideId);
  if (existing) {
    throw new Error(`Slide "${slideId}" already exists.`);
  }
  await set(slideRef(slideId), toRtdbSlideData(payload, "create"));
  return { id: slideId, ...payload };
}

export async function updateCommunityCarouselSlide(
  slideId: string,
  payload: CommunityCarouselSlidePayload,
): Promise<CommunityCarouselSlide | null> {
  await assertAuth();
  const existing = await fetchCommunityCarouselSlideById(slideId);
  if (!existing) return null;
  await update(slideRef(slideId), toRtdbSlideData(payload, "update"));
  return { id: slideId, ...payload };
}

export async function updateCommunityCarouselSlideFromForm(
  slideId: string,
  form: CommunityCarouselSlideForm,
): Promise<CommunityCarouselSlide | null> {
  return updateCommunityCarouselSlide(
    slideId,
    buildSlidePayloadFromForm(form),
  );
}

export async function deleteCommunityCarouselSlide(
  slideId: string,
): Promise<boolean> {
  await assertAuth();
  const existing = await fetchCommunityCarouselSlideById(slideId);
  if (!existing) return false;
  await remove(slideRef(slideId));
  return true;
}
