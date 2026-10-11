import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";


export const metadata = {
  title: "Dashboard | NexaReach Marketing OS",
  description: "Enterprise marketing management and verification platform",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient
      user={auth.user}
      workspace={auth.workspace}
    >
      {children}
    </DashboardLayoutClient>
  );
}
