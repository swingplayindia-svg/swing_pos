"use client";

import { useRouter } from "next/navigation";
import { TurfForm } from "@/components/turfs/turf-form";

export default function AddTurfPage() {
  const router = useRouter();

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-lg">
        Add a venue with full details (location, contact, amenities, pricing). Need many at once? Use{" "}
        <button
          type="button"
          onClick={() => router.push("/turfs/import")}
          className="text-primary font-medium hover:underline"
        >
          Import
        </button>{" "}
        in the tab above.
      </p>
      <TurfForm mode="add" onSuccess={() => router.push("/turfs")} />
    </div>
  );
}
