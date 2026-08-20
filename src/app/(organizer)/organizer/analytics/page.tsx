import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/modules/organizer/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const userRole = headersList.get("x-user-role");

  if (!userId || userRole !== "ORGANIZER") {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AnalyticsDashboard />
    </div>
  );
}
