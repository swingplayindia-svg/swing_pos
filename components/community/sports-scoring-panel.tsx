"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  disableAllSportScoring,
  fetchSportScoring,
  seedDefaultSportScoring,
  setSportScoringEnabled,
  setSportScoringImageUrl,
} from "@/lib/rtdb-sports-scoring-api";
import {
  SPORT_SCORING_DEFINITIONS,
  type SportScoringKey,
  type SportScoringState,
} from "@/lib/sports-scoring-schema";
import { SportScoringImageUpload } from "@/components/community/sport-scoring-image-upload";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function SportsScoringPanel() {
  const { user } = useAuth();
  const [sports, setSports] = useState<SportScoringState | null>(null);
  const [saving, setSaving] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setAccessError(null);
        setSports(await fetchSportScoring());
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not load sport config.";
        setAccessError(message);
        toast.error(message);
      }
    })();
  }, []);

  const groups = Array.from(
    new Set(SPORT_SCORING_DEFINITIONS.map((d) => d.group)),
  );

  async function toggle(key: SportScoringKey, enabled: boolean) {
    setSaving(true);
    try {
      setSports(await setSportScoringEnabled(key, enabled));
      toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveImage(key: SportScoringKey, imageUrl: string) {
    setSaving(true);
    try {
      setSports(await setSportScoringImageUrl(key, imageUrl));
      toast.success(imageUrl ? "Card image saved" : "Card image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function disableAll() {
    if (!sports) return;
    setSaving(true);
    try {
      setSports(await disableAllSportScoring());
      toast.success("All sports set to Coming soon");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    try {
      setSports(await fetchSportScoring());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    }
  }

  async function initNode() {
    setSaving(true);
    try {
      setSports(await seedDefaultSportScoring());
      toast.success("Initialized ongis_sports_scoring in RTDB");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Init failed");
    } finally {
      setSaving(false);
    }
  }

  if (accessError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">CMS admin access required</CardTitle>
          <CardDescription>{accessError}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {user?.id && (
            <p>
              Your Firebase UID:{" "}
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                {user.id}
              </code>
            </p>
          )}
          <p>
            In Firebase Console → Realtime Database → Data, add a child under{" "}
            <code className="text-xs bg-muted px-1 rounded">cmsAdmins</code> with
            your UID as the key and value{" "}
            <code className="text-xs bg-muted px-1 rounded">true</code> (boolean).
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Retry
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/settings">Open Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sports) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading sports…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live scoring &amp; card images</CardTitle>
          <CardDescription>
            Controls{" "}
            <code className="text-xs bg-muted px-1 rounded">ongis_sports_scoring</code>{" "}
            in Realtime Database. Each sport has{" "}
            <code className="text-xs bg-muted px-1 rounded">enabled</code> (live
            scoring vs Coming soon) and{" "}
            <code className="text-xs bg-muted px-1 rounded">imageUrl</code> (Firebase
            Storage — the iOS app should load and cache this URL instead of bundle
            assets).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {SPORT_SCORING_DEFINITIONS.filter((d) => d.group === group).map(
                  (def) => (
                    <div
                      key={def.key}
                      className="rounded-lg border border-border/80 bg-white/90 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{def.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {def.key}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {sports[def.key].enabled ? "Live" : "Soon"}
                          </span>
                          <Switch
                            checked={sports[def.key].enabled}
                            disabled={saving}
                            onCheckedChange={(checked) =>
                              void toggle(def.key, checked)
                            }
                          />
                        </div>
                      </div>
                      <SportScoringImageUpload
                        value={sports[def.key].imageUrl}
                        sportKey={def.key}
                        label={def.label}
                        disabled={saving}
                        onChange={(url) => void saveImage(def.key, url)}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => void refresh()}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" disabled={saving} onClick={() => void initNode()}>
              Seed defaults (all off)
            </Button>
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => void disableAll()}>
              Disable all
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200/80 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">iOS integration</CardTitle>
          <CardDescription className="space-y-2">
            <span className="block">
              Read{" "}
              <code className="text-xs">ongis_sports_scoring/{"{sportKey}"}/imageUrl</code>{" "}
              and{" "}
              <code className="text-xs">.../enabled</code>. Legacy boolean-only nodes
              still work for <code className="text-xs">enabled</code> until you re-save
              from this CMS.
            </span>
            <span className="block">
              Map RTDB <code className="text-xs">soccer</code> to your{" "}
              <code className="text-xs">football</code> enum if needed. Cache images with{" "}
              <code className="text-xs">URLCache</code> or SDWebImage/Kingfisher using the
              stable Storage URL (uploads use immutable cache headers).
            </span>
            <span className="block">
              Deploy updated{" "}
              <code className="text-xs">database.rules.json</code> and{" "}
              <code className="text-xs">storage.rules</code> for{" "}
              <code className="text-xs">sports-scoring/</code> paths.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-amber-200/80 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">Firebase setup</CardTitle>
          <CardDescription>
            Updates use the server API (Admin SDK). Your CMS login UID must be at{" "}
            <code className="text-xs">cmsAdmins/{"{uid}"}: true</code> in Realtime
            Database — copy your UID from Settings.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
