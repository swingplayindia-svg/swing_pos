import { AppLayout } from "@/components/app-layout";
import { CommunityHubShell } from "@/components/community/community-hub-shell";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <CommunityHubShell>{children}</CommunityHubShell>
    </AppLayout>
  );
}
