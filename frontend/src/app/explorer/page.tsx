import type { Metadata } from "next";

import { ExplorerContent } from "./explorer-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DISTRICT_NAME } from "@/config ori/app";

export const metadata: Metadata = {
  title: "Data Explorer",
  description: `Browse townships, town and village tracts, and wards and villages in ${DISTRICT_NAME}.`,
};

/**
 * Livestock database explorer: District > Township > Town / Village Tract >
 * Ward / Village.
 *
 * The selection is held in the URL (`?tsp=&tvg=&wv=`), so every view is
 * shareable and the back button works. Data fetching happens client-side
 * because the API requires the authenticated token.
 */
export default function ExplorerPage() {
  return (
    <ProtectedRoute>
      <ExplorerContent />
    </ProtectedRoute>
  );
}
