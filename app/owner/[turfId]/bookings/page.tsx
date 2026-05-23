"use client";

import { useParams } from "next/navigation";
import { OwnerBookingsPanel } from "@/components/owner/owner-bookings-panel";

export default function OwnerBookingsPage() {
  const turfId = useParams().turfId as string;
  return <OwnerBookingsPanel turfId={turfId} />;
}
