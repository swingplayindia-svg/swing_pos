export {
  fetchOwnedTurfsForUser,
  fetchTurfForOwner,
  assertOwnerCanAccessTurf,
  fetchTurfOwnerProfile,
  upsertTurfOwnerProfile,
  turfAllowsOwner,
} from "@/lib/firestore-turf-owners";

export {
  fetchBookingsForTurf,
  createTurfBooking,
  updateTurfBookingStatus,
  deleteTurfBooking,
} from "@/lib/firestore-turf-bookings";

export {
  fetchClosuresForTurf,
  fetchClosuresForMonth,
  toggleTurfClosure,
  removeTurfClosure,
  setTurfClosure,
} from "@/lib/firestore-turf-closures";

export {
  buildOwnerTurfUpdates,
  validateOwnerVenueForm,
  turfToOwnerVenueForm,
  EMPTY_OWNER_VENUE_FORM,
  dateKeyFromDate,
  type OwnerVenueForm,
  type TurfBooking,
  type TurfBookingStatus,
  type TurfClosure,
} from "@/lib/turf-owner-schema";

import { updateTurfInFirestore } from "@/lib/firestore-turfs";
import { assertOwnerCanAccessTurf } from "@/lib/firestore-turf-owners";
import {
  buildOwnerTurfUpdates,
  type OwnerVenueForm,
} from "@/lib/turf-owner-schema";
import type { Turf } from "@/lib/turf-schema";

export async function updateOwnerVenue(
  turfId: string,
  form: OwnerVenueForm,
): Promise<Turf | null> {
  await assertOwnerCanAccessTurf(turfId);
  return updateTurfInFirestore(turfId, buildOwnerTurfUpdates(form));
}
