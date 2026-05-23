"use client";

import { usePathname } from "next/navigation";
import { OwnerAuthProvider, useOwnerRouteGuard } from "@/hooks/use-owner-auth";
import { OwnerMobileShell } from "@/components/owner/owner-mobile-shell";

function OwnerLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/owner/login";
  const auth = useOwnerRouteGuard();

  if (isLogin) {
    return <>{children}</>;
  }

  if (auth.isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return <OwnerMobileShell>{children}</OwnerMobileShell>;
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OwnerAuthProvider>
      <OwnerLayoutInner>{children}</OwnerLayoutInner>
    </OwnerAuthProvider>
  );
}
