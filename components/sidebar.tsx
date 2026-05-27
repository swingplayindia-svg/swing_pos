"use client";

import { useEffect, useState, type ComponentType } from "react";
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
  Trophy,
  Bell,
  Flag,
  ScrollText,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  onLogout: () => void;
}

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefix?: boolean;
};

const TOP_LEVEL_ITEMS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/turfs", label: "Turfs", icon: Wind, matchPrefix: true },
  {
    href: "/community/carousels",
    label: "Community",
    icon: Images,
    matchPrefix: true,
  },
  {
    href: "/community/notifications",
    label: "Push",
    icon: Bell,
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CONFIGURATION_ITEMS: NavLink[] = [
  {
    href: "/community/onboarding/fandoms",
    label: "Fandom",
    icon: Flag,
    matchPrefix: true,
  },
  {
    href: "/community/onboarding/content",
    label: "Onboard Qs",
    icon: ScrollText,
    matchPrefix: true,
  },
  {
    href: "/community/scoring",
    label: "Sports Listing",
    icon: Trophy,
  },
];

function isNavActive(pathname: string, item: NavLink): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

function isConfigurationsActive(pathname: string): boolean {
  return CONFIGURATION_ITEMS.some((item) => isNavActive(pathname, item));
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const pathname = usePathname();

  const configurationsActive = isConfigurationsActive(pathname);

  useEffect(() => {
    if (configurationsActive) setConfigOpen(true);
  }, [configurationsActive]);

  function renderNavLink(item: NavLink, nested = false) {
    const Icon = item.icon;
    const active = isNavActive(pathname, item);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={!isExpanded ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg transition-colors",
          nested ? "px-3 py-2.5" : "px-4 py-3",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent",
          !isExpanded && "justify-center px-0 py-2.5",
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {isExpanded && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
          isExpanded ? "w-64" : "w-20",
        )}
      >
        <div className="flex flex-col h-full p-4">
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
              className={cn(
                "p-1 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground transition-colors",
                !isExpanded && "mx-auto",
              )}
            >
              {isExpanded ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {TOP_LEVEL_ITEMS.slice(0, 3).map((item) => renderNavLink(item))}

            {isExpanded ? (
              <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    configurationsActive
                      ? "bg-sidebar-accent/60 text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <SlidersHorizontal className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">
                    Configurations
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 opacity-70 transition-transform",
                      configOpen && "rotate-180",
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
                  {CONFIGURATION_ITEMS.map((item) => renderNavLink(item, true))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="space-y-0.5">
                <div
                  className={cn(
                    "flex justify-center py-2 rounded-lg",
                    configurationsActive && "bg-sidebar-accent/60",
                  )}
                  title="Configurations"
                >
                  <SlidersHorizontal className="w-5 h-5 text-sidebar-foreground" />
                </div>
                {CONFIGURATION_ITEMS.map((item) => renderNavLink(item, true))}
              </div>
            )}

            {TOP_LEVEL_ITEMS.slice(3).map((item) => renderNavLink(item))}
          </nav>

          <button
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors mt-2",
              !isExpanded && "justify-center",
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "transition-all duration-300",
          isExpanded ? "ml-64" : "ml-20",
        )}
      />
    </>
  );
}
