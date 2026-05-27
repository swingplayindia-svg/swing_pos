"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_SCREEN_CONTENT,
  SUGGESTED_SCREEN_KEYS,
  type OnboardingScreenContent,
} from "@/lib/onboarding-content-schema";
import { fetchScreenContent, saveScreenContent } from "@/lib/rtdb-onboarding-api";

function makeOptionId(title: string, idx: number) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || String(idx);
}

export function OnboardingContentPanel() {
  const [screenKey, setScreenKey] = useState<string>(SUGGESTED_SCREEN_KEYS[0]);
  const [content, setContent] = useState<OnboardingScreenContent>(DEFAULT_SCREEN_CONTENT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customKey, setCustomKey] = useState("");

  const keys = useMemo(() => {
    const all = new Set<string>(SUGGESTED_SCREEN_KEYS as unknown as string[]);
    if (customKey.trim()) all.add(customKey.trim());
    all.add(screenKey);
    return Array.from(all);
  }, [customKey, screenKey]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setContent(await fetchScreenContent(screenKey));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load content.");
        setContent(DEFAULT_SCREEN_CONTENT);
      } finally {
        setLoading(false);
      }
    })();
  }, [screenKey]);

  const addOption = () => {
    const idx = content.options.length;
    setContent({
      ...content,
      options: [
        ...content.options,
        { id: String(idx), title: "", subtitle: "", imageUrl: "" },
      ],
    });
  };

  const removeOption = (id: string) => {
    setContent({ ...content, options: content.options.filter((o) => o.id !== id) });
  };

  const updateOption = (id: string, patch: Partial<OnboardingScreenContent["options"][0]>) => {
    setContent({
      ...content,
      options: content.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  async function save() {
    setSaving(true);
    try {
      const normalized: OnboardingScreenContent = {
        title: content.title ?? "",
        subtitle: content.subtitle ?? "",
        options: content.options
          .map((o, idx) => ({
            id: o.id?.trim() || makeOptionId(o.title, idx),
            title: o.title?.trim() || "",
            subtitle: o.subtitle ?? "",
            imageUrl: o.imageUrl ?? "",
          }))
          .filter((o) => o.title),
      };
      setContent(await saveScreenContent(screenKey, normalized));
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding questions & options</CardTitle>
          <CardDescription>
            Controls <code className="text-xs bg-muted px-1 rounded">onboarding_content</code>{" "}
            in Realtime Database. iOS screens can read this to render headings, copy, and option lists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Screen key</p>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={screenKey}
                onChange={(e) => setScreenKey(e.target.value)}
                disabled={loading || saving}
              >
                {keys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Suggested keys: {SUGGESTED_SCREEN_KEYS.join(", ")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Add custom key</p>
              <Input
                placeholder="e.g. vibe_quiz_step_1"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => void save()} disabled={loading || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={addOption} disabled={loading || saving}>
                <Plus className="h-4 w-4 mr-2" />
                Add option
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Title</p>
                  <Input
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Subtitle</p>
                  <Input
                    value={content.subtitle}
                    onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Options</p>
                {content.options.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No options yet.</p>
                ) : null}
                {content.options.map((o, idx) => (
                  <div key={o.id} className="rounded-lg border border-border p-3 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Option {idx + 1} · id: {o.id}</p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeOption(o.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Title</p>
                        <Input
                          value={o.title}
                          onChange={(e) => updateOption(o.id, { title: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Subtitle</p>
                        <Input
                          value={o.subtitle}
                          onChange={(e) => updateOption(o.id, { subtitle: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Image URL (optional)</p>
                        <Input
                          value={o.imageUrl}
                          onChange={(e) => updateOption(o.id, { imageUrl: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

