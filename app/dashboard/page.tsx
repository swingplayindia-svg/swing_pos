"use client";

import { AppLayout } from "@/components/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTurfs, type Turf } from "@/lib/storage";
import { TrendingUp, Wind, Users, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [stats, setStats] = useState({
    totalTurfs: 0,
    totalBookings: 0,
    activeUsers: 0,
    revenue: 0,
  });

  useEffect(() => {
    void (async () => {
      try {
        const allTurfs = await getTurfs();
        setTurfs(allTurfs.slice(0, 5));
        setStats({
          totalTurfs: allTurfs.length,
          totalBookings: Math.floor(Math.random() * 500) + 100,
          activeUsers: Math.floor(Math.random() * 150) + 50,
          revenue: Math.floor(Math.random() * 100000) + 50000,
        });
      } catch {
        setTurfs([]);
      }
    })();
  }, []);

  const statCards = [
    {
      title: "Total Turfs",
      value: stats.totalTurfs,
      icon: Wind,
      color: "text-primary",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Clock,
      color: "text-foreground",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your venue overview.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Turfs */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Turfs</CardTitle>
            <CardDescription>Your recently added turf venues</CardDescription>
          </CardHeader>
          <CardContent>
            {turfs.length > 0 ? (
              <div className="space-y-4">
                {turfs.map((turf: any) => (
                  <div
                    key={turf.id}
                    className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-background transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-foreground">
                        {turf.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {turf.city}, {turf.state}
                      </p>
                    </div>
                    <Link href={`/turfs/${turf.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No turfs yet. Create your first venue!
                </p>
                <Link href="/turfs/add">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Add Turf
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
