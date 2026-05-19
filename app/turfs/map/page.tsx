"use client";

import dynamic from "next/dynamic";

const TurfsMapView = dynamic(
  () =>
    import("@/components/turfs/turfs-map-view").then((m) => m.TurfsMapView),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading map…
      </p>
    ),
  },
);

export default function TurfsMapPage() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Venues loaded from Firestore <code className="text-xs">turfs</code>{" "}
        collection. Click a pin or list item for full details.
      </p>
      <TurfsMapView />
    </div>
  );
}
