"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getFirebaseIdToken } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

type TokenUser = {
  uid: string;
  platform: string;
  source?: "rtdb" | "firestore";
  tokenPreview: string | null;
  updatedAt: number | null;
};

export function PushNotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [userId, setUserId] = useState("");
  const [notificationType, setNotificationType] = useState("system");
  const [sending, setSending] = useState(false);
  const [tokenUsers, setTokenUsers] = useState<TokenUser[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  async function loadTokens() {
    setLoadingTokens(true);
    try {
      const idToken = await getFirebaseIdToken();
      const res = await fetch("/api/admin/push-tokens", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tokens");
      setTokenUsers(data.users ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load tokens");
      setTokenUsers([]);
    } finally {
      setLoadingTokens(false);
    }
  }

  useEffect(() => {
    void loadTokens();
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (target === "user" && !userId.trim()) {
      toast.error("User ID is required for single-user send");
      return;
    }

    setSending(true);
    try {
      const idToken = await getFirebaseIdToken();
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          target,
          userId: target === "user" ? userId.trim() : undefined,
          notificationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail =
          data.errors?.find((e: string) => !e.startsWith("in-app ")) ??
          data.error;
        throw new Error(detail ?? "Send failed");
      }

      if (data.sent === 0 && (data.attempted ?? 0) > 0) {
        toast.error(
          data.error ??
            "Push failed for all devices. Check FCM API + service account permissions (see server logs).",
        );
        if (data.errors?.length) console.warn("Push errors", data.errors);
        return;
      }

      if ((data.failed ?? 0) > 0) {
        toast.warning(
          `Push sent to ${data.sent}/${data.attempted} · in-app ${data.inAppWritten}. Some devices failed.`,
        );
        if (data.errors?.length) console.warn("Push errors", data.errors);
      } else {
        toast.success(
          `Push sent to ${data.sent}/${data.attempted} devices · in-app ${data.inAppWritten}`,
        );
      }
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send push notification</CardTitle>
          <CardDescription>
            Sends FCM to registered devices and writes an in-app notification under{" "}
            <code className="text-xs bg-muted px-1 rounded">userNotifications</code>.
            Tokens are read from Realtime Database{" "}
            <code className="text-xs bg-muted px-1 rounded">userPushTokens</code> and/or
            Firestore <code className="text-xs bg-muted px-1 rounded">users.fcmToken</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-title">Title</Label>
            <Input
              id="push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New feature on Swing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="push-body">Message</Label>
            <Textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Tap to explore live scoring for your sport."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={target}
                onValueChange={(v) => setTarget(v as "all" | "user")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All registered devices</SelectItem>
                  <SelectItem value="user">Single user (UID)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>In-app type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {target === "user" && (
            <div className="space-y-2">
              <Label htmlFor="push-uid">Firebase user ID</Label>
              <Input
                id="push-uid"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Paste uid from list below"
                className="font-mono text-sm"
              />
            </div>
          )}
          <Button
            disabled={
              sending ||
              (target === "all" && tokenUsers.length === 0) ||
              (target === "user" &&
                Boolean(userId.trim()) &&
                !tokenUsers.some((u) => u.uid === userId.trim()))
            }
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send notification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Registered devices</CardTitle>
            <CardDescription>
              {loadingTokens
                ? "Loading…"
                : `${tokenUsers.length} user(s) with push tokens`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadTokens()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {tokenUsers.length === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="font-medium text-foreground">Cannot send yet</p>
              <p>
                No tokens in{" "}
                <code className="text-xs bg-muted px-1 rounded">userPushTokens</code> (RTDB)
                or <code className="text-xs bg-muted px-1 rounded">users.fcmToken</code>{" "}
                (Firestore). If you see <code className="text-xs">fcmToken</code> on a user
                doc in Firestore, click Refresh — it should list here with source{" "}
                <strong>firestore</strong>.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border text-sm">
              <table className="w-full">
                <thead className="bg-muted/50 text-left text-xs uppercase">
                  <tr>
                    <th className="p-2">User ID</th>
                    <th className="p-2">Source</th>
                    <th className="p-2">Platform</th>
                    <th className="p-2">Token</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenUsers.map((u) => (
                    <tr
                      key={u.uid}
                      className="border-t hover:bg-muted/30 cursor-pointer"
                      onClick={() => {
                        setTarget("user");
                        setUserId(u.uid);
                      }}
                    >
                      <td className="p-2 font-mono text-xs">{u.uid}</td>
                      <td className="p-2 capitalize text-muted-foreground">
                        {u.source ?? "—"}
                      </td>
                      <td className="p-2">{u.platform}</td>
                      <td className="p-2 text-muted-foreground">
                        {u.tokenPreview ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200/80 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base">iOS push (APNs) required</CardTitle>
          <CardDescription className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your FCM OAuth is working (<code className="text-xs bg-muted px-1">/api/health/fcm</code>).
              iOS devices need <strong>APNs</strong> in Firebase — otherwise Google returns a
              misleading &quot;OAuth&quot; error.
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a
                  className="text-primary underline"
                  href="https://console.firebase.google.com/project/swing-b7a0c/settings/cloudmessaging"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firebase → Project settings → Cloud Messaging
                </a>
              </li>
              <li>Under your <strong>iOS app</strong>, upload APNs Auth Key (.p8)</li>
              <li>Enter Key ID, Team ID, and Bundle ID from Apple Developer</li>
              <li>Send push again from this page</li>
            </ol>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-blue-200/80 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base">FCM not delivering?</CardTitle>
          <CardDescription className="space-y-2">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you see <strong>0/N devices</strong> and OAuth / authentication
                errors in the console, configure Google Cloud for your Firebase
                project:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Enable <strong>Firebase Cloud Messaging API</strong> (APIs &amp;
                  Services)
                </li>
                <li>
                  Grant <code className="text-xs bg-muted px-1">FIREBASE_CLIENT_EMAIL</code>{" "}
                  the role <strong>Firebase Cloud Messaging Admin</strong>
                </li>
                <li>
                  Restart dev server, then visit{" "}
                  <code className="text-xs bg-muted px-1">/api/health/fcm</code> —
                  should return <code className="text-xs">ok: true</code>
                </li>
              </ol>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
