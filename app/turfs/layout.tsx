import { AppLayout } from "@/components/app-layout";
import { TurfsHubShell } from "@/components/turfs/turfs-hub-shell";

export default function TurfsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <TurfsHubShell>{children}</TurfsHubShell>
    </AppLayout>
  );
}
