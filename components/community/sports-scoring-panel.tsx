"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  disableAllSportScoringFlags,
  fetchSportScoringFlags,
  seedDefaultSportScoringFlags,
  setSportScoringEnabled,
} from "@/lib/rtdb-sports-scoring-api";
import {
  SPORT_SCORING_DEFINITIONS,
  type SportScoringFlags,
  type SportScoringKey,
} from "@/lib/sports-scoring-schema";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function SportsScoringPanel() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<SportScoringFlags | null>(null);
  const [saving, setSaving] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setAccessError(null);
        setFlags(await fetchSportScoringFlags());
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not load sport flags.";
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
      setFlags(await setSportScoringEnabled(key, enabled));
      toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function disableAll() {
    if (!flags) return;
    setSaving(true);
    try {
      setFlags(await disableAllSportScoringFlags());
      toast.success("All sports set to Coming soon");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function refresh() {
    try {
      setFlags(await fetchSportScoringFlags());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    }
  }

  async function initNode() {
    setSaving(true);
    try {
      setFlags(await seedDefaultSportScoringFlags());
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

  if (!flags) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading sport flags…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live scoring toggles</CardTitle>
          <CardDescription>
            Controls{" "}
            <code className="text-xs bg-muted px-1 rounded">ongis_sports_scoring</code>{" "}
            in Realtime Database. The iOS app reads this in real time — enabled sports
            show live scoring; disabled show Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.map((group) => (
            <div key={group} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SPORT_SCORING_DEFINITIONS.filter((d) => d.group === group).map(
                  (def) => (
                    <div
                      key={def.key}
                      className="flex items-center justify-between rounded-lg border border-border/80 bg-white/90 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{def.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {def.key}
                        </p>
                      </div>
                      <Switch
                        checked={flags[def.key]}
                        disabled={saving}
                        onCheckedChange={(checked) =>
                          void toggle(def.key, checked)
                        }
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
          <CardTitle className="text-base">Firebase setup</CardTitle>
          <CardDescription>
            Updates use the server API (Admin SDK). Your CMS login UID must be at{" "}
            <code className="text-xs">cmsAdmins/{"{uid}"}: true</code> in Realtime
            Database — copy your UID from Settings. iOS still reads{" "}
            <code className="text-xs">ongis_sports_scoring</code> directly (read rules
            in <code className="text-xs">database.rules.json</code>).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
