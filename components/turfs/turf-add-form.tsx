"use client";

import { TurfForm } from "./turf-form";

interface TurfAddFormProps {
  onSuccess: () => void;
}

/** @deprecated Prefer TurfForm directly */
export function TurfAddForm({ onSuccess }: TurfAddFormProps) {
  return <TurfForm mode="add" onSuccess={onSuccess} />;
}
