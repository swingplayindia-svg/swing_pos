"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurfVenueCard, type TurfCardData } from "@/components/turfs/turf-venue-card";
import { getTurfs, deleteTurf } from "@/lib/storage";
import { ensureFirebaseAuthReady } from "@/hooks/use-auth";
import { Plus, Search, Wind } from "lucide-react";

export default function TurfsPage() {
  const [turfs, setTurfs] = useState<TurfCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      await ensureFirebaseAuthReady();
      const data = await getTurfs();
      setTurfs(data as TurfCardData[]);
    } catch (err) {
      console.error(err);
      setTurfs([]);
    }
  };

  useEffect(() => {
    void (async () => {
      await refresh();
      setIsLoading(false);
    })();
  }, []);

  const filteredTurfs = turfs.filter(
    (turf) =>
      turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turf.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turf.area.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-border/80 shadow-sm"
          />
        </div>
        <Link href="/turfs/add">
          <Button className="btn-primary-glow">
            <Plus className="h-4 w-4 mr-2" />
            Quick add
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground text-sm">Loading venues…</p>
      ) : filteredTurfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTurfs.map((turf) => (
            <TurfVenueCard
              key={turf.id}
              turf={turf}
              onDelete={(id) => {
                if (confirm("Remove this venue from your portfolio?")) {
                  void (async () => {
                    await deleteTurf(id);
                    await refresh();
                  })();
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-b from-accent/30 to-background px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wind className="h-7 w-7 text-primary/60" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {searchTerm ? "No matches" : "No venues yet"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {searchTerm
              ? "Try a different search term."
              : "Add a venue manually or import from Excel using the tabs above."}
          </p>
          {!searchTerm && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/turfs/add">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add venue
                </Button>
              </Link>
              <Link href="/turfs/import">
                <Button variant="outline" className="border-border">
                  Import Excel
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
