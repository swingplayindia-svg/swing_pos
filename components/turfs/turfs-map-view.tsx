"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TurfMapPopup } from "@/components/turfs/turf-map-popup";
import { ensureFirebaseAuthReady } from "@/hooks/use-auth";
import { getTurfs } from "@/lib/storage";
import type { Turf } from "@/lib/turf-schema";
import {
  getMapCenter,
  getMappableTurfs,
  hasMapCoordinates,
} from "@/lib/turf-map";
import { cn } from "@/lib/utils";
import { MapPin, Star } from "lucide-react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ turfs }: { turfs: Turf[] }) {
  const map = useMap();

  useEffect(() => {
    if (turfs.length === 0) return;
    const bounds = L.latLngBounds(
      turfs.map((t) => [t.lat, t.lon] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, turfs]);

  return null;
}

function FlyToTurf({ turf }: { turf: Turf | null }) {
  const map = useMap();

  useEffect(() => {
    if (!turf) return;
    map.flyTo([turf.lat, turf.lon], 15, { duration: 0.8 });
  }, [map, turf]);

  return null;
}

export function TurfsMapView() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await ensureFirebaseAuthReady();
        const data = await getTurfs();
        setTurfs(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load turfs from Firestore.",
        );
        setTurfs([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const mappable = useMemo(() => getMappableTurfs(turfs), [turfs]);
  const missingCoords = turfs.length - mappable.length;
  const selected = mappable.find((t) => t.id === selectedId) ?? null;
  const center = getMapCenter(turfs);

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading venues from Firestore…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-0 lg:h-[min(72vh,720px)] rounded-xl border border-border/80 overflow-hidden bg-card shadow-sm">
      {/* Venue list */}
      <aside className="lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-border/80 flex flex-col max-h-[280px] lg:max-h-none">
        <div className="px-4 py-3 border-b border-border/80 bg-muted/30">
          <p className="text-sm font-medium text-foreground">
            {mappable.length} on map
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {turfs.length} total in Firestore
            {missingCoords > 0 && ` · ${missingCoords} missing lat/lon`}
          </p>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-border/60">
          {turfs.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No turfs in collection yet.
            </li>
          ) : (
            turfs.map((turf) => {
              const onMap = hasMapCoordinates(turf);
              return (
                <li key={turf.id}>
                  <button
                    type="button"
                    disabled={!onMap}
                    onClick={() => onMap && setSelectedId(turf.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
                      selectedId === turf.id && "bg-primary/10",
                    )}
                  >
                    <p className="font-medium text-sm text-foreground line-clamp-1">
                      {turf.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {turf.area}, {turf.city}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {turf.address}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        {turf.rating}
                      </span>
                      <span className="text-muted-foreground">
                        ₹{turf.pricing.weekday}/hr
                      </span>
                      {!onMap && (
                        <span className="text-amber-600">No coordinates</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Map */}
      <div className="flex-1 min-h-[360px] lg:min-h-0 relative z-0">
        {mappable.length === 0 ? (
          <div className="flex h-full min-h-[360px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No venues have valid coordinates. Add lat and lon when creating turfs.
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={11}
            className="h-full min-h-[360px] w-full z-0"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds turfs={mappable} />
            <FlyToTurf turf={selected} />
            {mappable.map((turf) => (
              <Marker
                key={turf.id}
                position={[turf.lat, turf.lon]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => setSelectedId(turf.id),
                }}
              >
                <Popup>
                  <TurfMapPopup turf={turf} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
