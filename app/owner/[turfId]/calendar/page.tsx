"use client";

import { useParams } from "next/navigation";
import { OwnerClosureCalendar } from "@/components/owner/owner-closure-calendar";

export default function OwnerCalendarPage() {
  const turfId = useParams().turfId as string;
  return <OwnerClosureCalendar turfId={turfId} />;
}
