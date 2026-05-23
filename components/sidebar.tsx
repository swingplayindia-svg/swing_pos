"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wind,
  Settings,
  Menu,
  X,
  LogOut,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/turfs", label: "Turfs", icon: Wind, matchPrefix: true },
    {
      href: "/community/carousels",
      label: "Community",
      icon: Images,
      matchPrefix: true,
    },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
          isExpanded ? "w-64" : "w-20",
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            {isExpanded && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Swing Logo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="font-bold text-sidebar-foreground text-lg">
                  Swing
                </span>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground transition-colors"
            >
              {isExpanded ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                "matchPrefix" in item && item.matchPrefix
                  ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              !isExpanded && "justify-center",
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div
        className={cn(
          "transition-all duration-300",
          isExpanded ? "ml-64" : "ml-20",
        )}
      />
    </>
  );
}
