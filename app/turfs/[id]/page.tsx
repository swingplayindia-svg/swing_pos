"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTurfById, deleteTurf, type Turf } from "@/lib/storage";
import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Trash2,
  Pencil,
  IndianRupee,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

const AMENITY_LABELS: Record<keyof Turf["amenities"], string> = {
  floodlights: "Floodlights",
  washrooms: "Washrooms",
  drinking_water: "Drinking water",
  parking: "Parking",
  changing_rooms: "Changing rooms",
  seating: "Seating",
};

export default function TurfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const found = await getTurfById(params.id as string);
        setTurf(found ?? null);
      } catch {
        setTurf(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id]);

  const handleDelete = () => {
    if (confirm("Remove this venue permanently?")) {
      void (async () => {
        await deleteTurf(params.id as string);
        router.push("/turfs");
      })();
    }
  };

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!turf) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground mb-4">Venue not found.</p>
        <Button onClick={() => router.push("/turfs")} variant="outline">
          Back to all venues
        </Button>
      </div>
    );
  }

  const activeAmenities = (
    Object.entries(turf.amenities) as [keyof Turf["amenities"], boolean][]
  ).filter(([, on]) => on);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            {turf.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{turf.slug}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{turf.rating}</span>
              ({turf.total_reviews} reviews)
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {turf.area}, {turf.city}
              {turf.state ? `, ${turf.state}` : ""}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/turfs/${turf.id}/edit`}>
            <Button size="sm" className="btn-primary-glow">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <div className="h-48 bg-muted/30 overflow-hidden">
              {turf.turfImage && turf.turfImage !== "/turf-default.jpg" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={turf.turfImage}
                  alt={turf.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-5xl opacity-40">
                  🏟️
                </div>
              )}
            </div>
            <CardContent className="pt-4 space-y-2 text-sm">
              <p className="text-foreground">{turf.address}</p>
              {turf.landmark && (
                <p className="text-muted-foreground">Landmark: {turf.landmark}</p>
              )}
              <p className="text-muted-foreground">
                {turf.pincode} · {turf.country}
                {turf.lat && turf.lon
                  ? ` · ${turf.lat.toFixed(4)}, ${turf.lon.toFixed(4)}`
                  : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Sports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {turf.sports.map((sport) => (
                  <span
                    key={sport}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {sport}
                  </span>
                ))}
              </div>
              {activeAmenities.length > 0 && (
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeAmenities.map(([key]) => (
                      <span
                        key={key}
                        className="rounded-md bg-muted px-2.5 py-1 text-xs text-foreground"
                      >
                        {AMENITY_LABELS[key]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-muted/20">
            <CardContent className="pt-4 space-y-2 text-sm">
              <InfoRow label="Turf surface" value={turf.turf_surface} />
              <InfoRow label="Turf location" value={turf.turf_location || "—"} />
              <InfoRow label="Courts / turfs" value={String(turf.num_turfs)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/80 shadow-sm border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateRow label="Weekday" amount={turf.pricing.weekday} />
              <RateRow label="Weekend" amount={turf.pricing.weekend} />
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {turf.contact.phone && (
                <a
                  href={`tel:${turf.contact.phone}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  {turf.contact.phone}
                </a>
              )}
              {turf.contact.whatsapp && (
                <a
                  href={`https://wa.me/${turf.contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  WhatsApp
                </a>
              )}
              {turf.email && (
                <a
                  href={`mailto:${turf.email}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary break-all"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  {turf.email}
                </a>
              )}
              <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t border-border">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                {turf.open_24_hours
                  ? "Open 24 hours"
                  : `${turf.open_time} – ${turf.close_time}`}
              </div>
              {turf.turf_url && (
                <a
                  href={turf.turf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Booking / listing page
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RateRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between items-center rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">₹{amount}/hr</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
