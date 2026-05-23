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
import {
  fetchBookingsForTurf,
  fetchClosuresForMonth,
  fetchTurfForOwner,
} from "@/lib/storage-owner";
import type { TurfClosure, TurfBooking } from "@/lib/turf-owner-schema";
import type { Turf } from "@/lib/turf-schema";
import {
  fetchOwnerCached,
  getOwnerCached,
  invalidateOwnerCache,
  ownerCacheKey,
  OWNER_CACHE_TTL,
} from "@/lib/owner-cache";

type OwnerTurfDataValue = {
  turfId: string;
  turf: Turf | null;
  turfLoading: boolean;
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
  const turfKey = ownerCacheKey(turfId, "turf");
  const bookingsKey = ownerCacheKey(turfId, "bookings");

  const [turf, setTurf] = useState<Turf | null>(null);
  const [turfLoading, setTurfLoading] = useState(true);
  const [bookings, setBookings] = useState<TurfBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const refreshTurf = useCallback(
    async (force = false) => {
      if (!force) {
        const hit = getOwnerCached<Turf>(turfKey);
        if (hit) {
          setTurf(hit);
          setTurfLoading(false);
          return hit;
        }
      }

      setTurfLoading(true);
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
        return data;
      } catch {
        setTurf(null);
        return null;
      } finally {
        setTurfLoading(false);
      }
    },
    [turfId, turfKey],
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
    setTurf(null);
    setBookings([]);
    setTurfLoading(true);
    void refreshTurf(false);
  }, [turfId, refreshTurf]);

  const value = useMemo(
    () => ({
      turfId,
      turf,
      turfLoading,
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
