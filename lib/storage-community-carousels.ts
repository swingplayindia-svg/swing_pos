import {
  buildSlidePayloadFromForm,
  type CommunityCarouselSlide,
  type CommunityCarouselSlideForm,
  type CommunityCarouselSlidePayload,
} from "@/lib/community-carousel-schema";
import {
  createCommunityCarouselSlide,
  createCommunityCarouselSlideWithId,
  deleteCommunityCarouselSlide,
  fetchCommunityCarouselSlideById,
  fetchCommunityCarouselSlides,
  subscribeCommunityCarouselSlides,
  updateCommunityCarouselSlide,
  updateCommunityCarouselSlideFromForm,
} from "@/lib/rtdb-community-carousels";

export type {
  CommunityCarouselSlide,
  CommunityCarouselSlideForm,
  CommunityCarouselSlidePayload,
} from "@/lib/community-carousel-schema";

export {
  IOS_DEFAULT_SLIDES,
  TOP_COLOR_PRESETS,
  EMPTY_CAROUSEL_SLIDE_FORM,
  normalizeHexColor,
  slideToForm,
  validateCarouselSlideForm,
  isRemoteImageUrl,
} from "@/lib/community-carousel-schema";

export async function getCommunityCarouselSlides() {
  return fetchCommunityCarouselSlides();
}

export function watchCommunityCarouselSlides(
  onSlides: (slides: CommunityCarouselSlide[]) => void,
  onError?: (err: Error) => void,
) {
  return subscribeCommunityCarouselSlides(onSlides, onError);
}

export async function getCommunityCarouselSlideById(slideId: string) {
  return fetchCommunityCarouselSlideById(slideId);
}

export async function addCommunityCarouselSlide(
  form: CommunityCarouselSlideForm,
  options?: { slideId?: string },
) {
  const payload = buildSlidePayloadFromForm(form);
  if (options?.slideId?.trim()) {
    return createCommunityCarouselSlideWithId(
      options.slideId.trim(),
      payload,
    );
  }
  return createCommunityCarouselSlide(payload);
}

export async function saveCommunityCarouselSlide(
  slideId: string,
  form: CommunityCarouselSlideForm,
) {
  return updateCommunityCarouselSlideFromForm(slideId, form);
}

export async function patchCommunityCarouselSlide(
  slideId: string,
  payload: Partial<CommunityCarouselSlidePayload>,
) {
  const existing = await fetchCommunityCarouselSlideById(slideId);
  if (!existing) return null;
  return updateCommunityCarouselSlide(slideId, {
    imageUrl: payload.imageUrl ?? existing.imageUrl,
    top_color: payload.top_color ?? existing.top_color,
    order: payload.order ?? existing.order,
    linkUrl:
      payload.linkUrl !== undefined ? payload.linkUrl : existing.linkUrl,
  });
}

export async function deleteCommunityCarouselSlideById(slideId: string) {
  return deleteCommunityCarouselSlide(slideId);
}
