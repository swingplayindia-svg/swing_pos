import type { Turf } from "@/lib/turf-schema";

export function hasMapCoordinates(turf: Turf): boolean {
  return (
    Number.isFinite(turf.lat) &&
    Number.isFinite(turf.lon) &&
    Math.abs(turf.lat) <= 90 &&
    Math.abs(turf.lon) <= 180 &&
    !(turf.lat === 0 && turf.lon === 0)
  );
}

export function getMappableTurfs(turfs: Turf[]): Turf[] {
  return turfs.filter(hasMapCoordinates);
}

/** Default center: Mumbai */
export const DEFAULT_MAP_CENTER: [number, number] = [19.076, 72.8777];

export function getMapCenter(turfs: Turf[]): [number, number] {
  const mappable = getMappableTurfs(turfs);
  if (mappable.length === 0) return DEFAULT_MAP_CENTER;
  const lat =
    mappable.reduce((sum, t) => sum + t.lat, 0) / mappable.length;
  const lon =
    mappable.reduce((sum, t) => sum + t.lon, 0) / mappable.length;
  return [lat, lon];
}
