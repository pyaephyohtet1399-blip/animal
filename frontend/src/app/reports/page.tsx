import type { Metadata } from "next";

import { ReportsContent } from "./reports-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Census records arranged by township, tract, village and animal group, printable as a single document.",
};

/**
 * Reports.
 *
 * One scope, several arrangements of the same census records. The selection
 * lives in the URL so a printed document can be reproduced exactly. Data
 * fetching happens client-side because the API requires the authenticated token.
 */
export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}
