"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import type { OnboardingFandom } from "@/lib/onboarding-content-schema";
import { deleteFandom, fetchFandoms, uploadFandomImage, upsertFandom } from "@/lib/rtdb-onboarding-api";

function newId(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `fandom_${Date.now()}`;
}

export function OnboardingFandomsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fandoms, setFandoms] = useState<OnboardingFandom[]>([]);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setFandoms(await fetchFandoms());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load fandoms.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fandoms;
    return fandoms.filter(
      (f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q),
    );
  }, [fandoms, query]);

  const nextOrder = useMemo(() => {
    const max = fandoms.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
    return fandoms.length ? max + 1 : 1;
  }, [fandoms]);

  async function create() {
    const name = newName.trim();
    if (!name) return;
    const id = newId(name);
    setSaving(true);
    try {
      setFandoms(
        await upsertFandom(id, { name, enabled: true, order: nextOrder, imageUrl: "" }),
      );
      setNewName("");
      toast.success("Fandom created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setSaving(true);
    try {
      setFandoms(await upsertFandom(id, { enabled }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function rename(id: string, name: string) {
    setSaving(true);
    try {
      setFandoms(await upsertFandom(id, { name }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function setOrder(id: string, order: number) {
    setSaving(true);
    try {
      setFandoms(await upsertFandom(id, { order }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this fandom?")) return;
    setSaving(true);
    try {
      setFandoms(await deleteFandom(id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function upload(id: string, file: File) {
    setSaving(true);
    try {
      const url = await uploadFandomImage(file, id);
      setFandoms(await upsertFandom(id, { imageUrl: url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading fandoms…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fandoms (flags)</CardTitle>
          <CardDescription>
            Controls <code className="text-xs bg-muted px-1 rounded">onboarding_fandoms</code>{" "}
            in Realtime Database. iOS uses these as the Favorite Team / Fandom list (flag image + name).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="New fandom name (e.g. India, FC Barcelona)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={saving}
              />
              <Button onClick={() => void create()} disabled={saving || !newName.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search fandoms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
              disabled={saving}
            />
            {query ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-muted border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {f.imageUrl ? (
                      <img src={f.imageUrl} alt={f.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{f.id}</p>
                    <p className="text-xs text-muted-foreground">Shown in iOS</p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <Input
                      value={f.name}
                      onChange={(e) => void rename(f.id, e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Order</p>
                    <Input
                      type="number"
                      value={String(f.order ?? 0)}
                      onChange={(e) => void setOrder(f.id, Number(e.target.value) || 0)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Enabled</p>
                    <div className="h-10 flex items-center justify-between rounded-md border border-border px-3">
                      <span className="text-sm">{f.enabled ? "Yes" : "No"}</span>
                      <Switch
                        checked={Boolean(f.enabled)}
                        onCheckedChange={(v) => void toggle(f.id, Boolean(v))}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(f.id, file);
                        e.currentTarget.value = "";
                      }}
                      disabled={saving}
                    />
                    <Button type="button" variant="secondary" disabled={saving} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </span>
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => void remove(f.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {saving ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </div>
      ) : null}
    </div>
  );
}

