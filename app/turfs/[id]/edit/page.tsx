"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TurfForm } from "@/components/turfs/turf-form";
import { turfToForm } from "@/lib/turf-defaults";
import { getTurfById } from "@/lib/storage";
import { Button } from "@/components/ui/button";

export default function EditTurfPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [initial, setInitial] = useState<ReturnType<typeof turfToForm> | null>(null);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const turf = await getTurfById(id);
        if (turf) {
          setInitial(turfToForm(turf));
          setOwnerIds(turf.ownerIds ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">Loading venue…</p>
    );
  }

  if (!initial) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">Venue not found.</p>
        <Button variant="outline" onClick={() => router.push("/turfs")}>
          Back to venues
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-lg">
        Update any field and save. Changes sync to your venue list immediately.
      </p>
      <TurfForm
        mode="edit"
        turfId={id}
        initialData={initial}
        initialOwnerIds={ownerIds}
        onSuccess={() => router.push(`/turfs/${id}`)}
      />
    </div>
  );
}
