"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Check, Copy } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyUid = async () => {
    if (!user?.id) return;
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Information */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="mt-1 font-medium text-foreground">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="mt-1 font-medium text-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <p className="mt-1 font-medium text-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card border-primary/20">
          <CardHeader>
            <CardTitle>Firebase CMS admin</CardTitle>
            <CardDescription>
              Required to save Community carousel slides when{" "}
              <code className="text-xs bg-muted px-1 rounded">cmsAdmins</code> is
              configured in Realtime Database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Your Firebase UID</label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
                  {user?.id ?? "—"}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-border shrink-0"
                  onClick={() => void copyUid()}
                  disabled={!user?.id}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy UID
                    </>
                  )}
                </Button>
              </div>
            </div>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                Firebase Console → Realtime Database → <strong>Rules</strong> → publish{" "}
                <code className="text-xs">database.rules.json</code> from{" "}
                <code className="text-xs">swing_ios_app</code>
              </li>
              <li>
                Realtime Database → <strong>Data</strong> → add{" "}
                <code className="text-xs">cmsAdmins / {"{your UID}"} / true</code>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Until any entry exists under <code className="bg-muted px-1 rounded">cmsAdmins</code>,
              any signed-in CMS user can write carousels (bootstrap). After you add admins, only
              listed UIDs can write.
            </p>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your dashboard experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Appearance</p>
                <p className="text-sm text-muted-foreground">Light theme</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">
                  Email Notifications
                </p>
                <p className="text-sm text-muted-foreground">
                  Get updates about your bookings
                </p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-border justify-start"
            >
              Documentation
            </Button>
            <Button
              variant="outline"
              className="w-full border-border justify-start"
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="w-full border-border justify-start"
            >
              Report a Bug
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Swing.Play Admin Dashboard v1.0</p>
            <p>© 2026 Swing.Play. All rights reserved.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
