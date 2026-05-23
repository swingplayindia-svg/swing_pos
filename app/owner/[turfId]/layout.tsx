"use client";

import { useParams } from "next/navigation";
import { OwnerTurfDataProvider } from "@/hooks/use-owner-turf-data";

export default function OwnerTurfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const turfId = useParams().turfId as string;
  return <OwnerTurfDataProvider turfId={turfId}>{children}</OwnerTurfDataProvider>;
}
