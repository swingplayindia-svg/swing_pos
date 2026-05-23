"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "@/lib/turf-map";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type OwnerMapPickerProps = {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
};

export function OwnerMapPicker({ lat, lon, onChange }: OwnerMapPickerProps) {
  const hasCoords = lat !== 0 || lon !== 0;
  const center: [number, number] = hasCoords ? [lat, lon] : DEFAULT_MAP_CENTER;
  const position: [number, number] = hasCoords ? [lat, lon] : center;


  return (
    <div className="overflow-hidden rounded-xl border border-border h-52">
      <MapContainer
        center={center}
        zoom={hasCoords ? 15 : 12}
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onChange} />
        {hasCoords && (
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat: la, lng } = e.target.getLatLng();
                onChange(la, lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
