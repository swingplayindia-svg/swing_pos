"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { fetchTurfForOwner } from "@/lib/fetch-turf-for-owner";
import {
  fetchBookingsForTurf,
  fetchClosuresForMonth,
} from "@/lib/storage-owner";
import type { TurfClosure, TurfBooking } from "@/lib/turf-owner-schema";
import type { Turf } from "@/lib/turf-schema";
import {
  fetchOwnerCached,
  getOwnerCached,
  invalidateOwnerCache,
  ownerCacheKey,
  OWNER_CACHE_TTL,
  setOwnerCached,
} from "@/lib/owner-cache";

type OwnerTurfDataValue = {
  turfId: string;
  turf: Turf | null;
  turfLoading: boolean;
  turfError: boolean;
  refreshTurf: (force?: boolean) => Promise<Turf | null>;
  bookings: TurfBooking[];
  bookingsLoading: boolean;
  ensureBookings: (force?: boolean) => Promise<TurfBooking[]>;
  refreshBookings: () => Promise<TurfBooking[]>;
  getClosuresForMonth: (
    year: number,
    month: number,
    force?: boolean,
  ) => Promise<TurfClosure[]>;
  invalidateClosures: () => void;
  invalidateTurf: () => void;
};

const OwnerTurfDataContext = createContext<OwnerTurfDataValue | null>(null);

export function OwnerTurfDataProvider({
  turfId,
  children,
}: {
  turfId: string;
  children: ReactNode;
}) {
  const { ownedTurfs, turfsLoadState } = useOwnerAuth();
  const turfKey = ownerCacheKey(turfId, "turf");
  const bookingsKey = ownerCacheKey(turfId, "bookings");

  const [turf, setTurf] = useState<Turf | null>(null);
  const [turfLoading, setTurfLoading] = useState(true);
  const [turfError, setTurfError] = useState(false);
  const [bookings, setBookings] = useState<TurfBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const refreshTurf = useCallback(
    async (force = false) => {
      if (!force) {
        const hit = getOwnerCached<Turf>(turfKey);
        if (hit) {
          setTurf(hit);
          setTurfLoading(false);
          setTurfError(false);
          return hit;
        }
      }

      const seeded = ownedTurfs.find((t) => t.id === turfId);
      if (seeded && !force) {
        setTurf(seeded);
        setTurfLoading(false);
        setTurfError(false);
        setOwnerCached(turfKey, seeded, OWNER_CACHE_TTL.turf);
      } else {
        setTurfLoading(true);
      }

      try {
        const data = await fetchOwnerCached(
          turfKey,
          OWNER_CACHE_TTL.turf,
          async () => {
            const t = await fetchTurfForOwner(turfId);
            if (!t) throw new Error("Venue not found.");
            return t;
          },
          { force },
        );
        setTurf(data);
        setTurfError(false);
        return data;
      } catch {
        setTurf(seeded ?? null);
        setTurfError(true);
        return seeded ?? null;
      } finally {
        setTurfLoading(false);
      }
    },
    [turfId, turfKey, ownedTurfs],
  );

  const ensureBookings = useCallback(
    async (force = false) => {
      if (!force) {
        const hit = getOwnerCached<TurfBooking[]>(bookingsKey);
        if (hit) {
          setBookings(hit);
          return hit;
        }
      }

      setBookingsLoading(true);
      try {
        const data = await fetchOwnerCached(
          bookingsKey,
          OWNER_CACHE_TTL.bookings,
          () => fetchBookingsForTurf(turfId),
          { force },
        );
        setBookings(data);
        return data;
      } catch {
        setBookings([]);
        return [];
      } finally {
        setBookingsLoading(false);
      }
    },
    [turfId, bookingsKey],
  );

  const refreshBookings = useCallback(async () => {
    invalidateOwnerCache(turfId, "bookings");
    return ensureBookings(true);
  }, [turfId, ensureBookings]);

  const getClosuresForMonth = useCallback(
    async (year: number, month: number, force = false) => {
      const key = ownerCacheKey(
        turfId,
        "closures",
        `${year}-${String(month).padStart(2, "0")}`,
      );
      return fetchOwnerCached(
        key,
        OWNER_CACHE_TTL.closures,
        () => fetchClosuresForMonth(turfId, year, month),
        { force },
      );
    },
    [turfId],
  );

  const invalidateClosures = useCallback(() => {
    invalidateOwnerCache(turfId, "closures");
  }, [turfId]);

  const invalidateTurf = useCallback(() => {
    invalidateOwnerCache(turfId, "turf");
    setTurf(null);
  }, [turfId]);

  useEffect(() => {
    if (turfsLoadState !== "ready") return;

    const seeded = ownedTurfs.find((t) => t.id === turfId);
    if (seeded) {
      setTurf(seeded);
      setOwnerCached(turfKey, seeded, OWNER_CACHE_TTL.turf);
      setTurfLoading(false);
    }

    void refreshTurf(Boolean(seeded));
  }, [turfId, turfsLoadState, ownedTurfs, turfKey, refreshTurf]);

  const value = useMemo(
    () => ({
      turfId,
      turf,
      turfLoading,
      turfError,
      refreshTurf,
      bookings,
      bookingsLoading,
      ensureBookings,
      refreshBookings,
      getClosuresForMonth,
      invalidateClosures,
      invalidateTurf,
    }),
    [
      turfId,
      turf,
      turfLoading,
      turfError,
      refreshTurf,
      bookings,
      bookingsLoading,
      ensureBookings,
      refreshBookings,
      getClosuresForMonth,
      invalidateClosures,
      invalidateTurf,
    ],
  );

  return (
    <OwnerTurfDataContext.Provider value={value}>
      {children}
    </OwnerTurfDataContext.Provider>
  );
}

export function useOwnerTurfData() {
  const ctx = useContext(OwnerTurfDataContext);
  if (!ctx) {
    throw new Error("useOwnerTurfData must be used within OwnerTurfDataProvider");
  }
  return ctx;
}
