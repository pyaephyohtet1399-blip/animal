import type { Metadata } from "next";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "District-wide census totals and livestock distribution.",
};

/**
 * District overview: totals first, then how the livestock is distributed, then
 * the households behind those numbers.
 *
 * The page is a server component for metadata; data fetching happens in the
 * client component because the API requires the authenticated token.
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
