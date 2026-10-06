import type { Metadata } from "next";

import { CensusContent } from "./census-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Census Records",
  description:
    "Search and filter every household interview in the district with the livestock counted in it.",
};

/**
 * Census records: one row per `interview_info` record, with its geography and
 * livestock resolved.
 *
 * The query lives in the URL, so filtering, sorting and paging happen in the
 * client component. Data fetching happens client-side because the API requires
 * the authenticated token.
 */
export default function CensusPage() {
  return (
    <ProtectedRoute>
      <CensusContent />
    </ProtectedRoute>
  );
}
