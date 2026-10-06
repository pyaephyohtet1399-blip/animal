import { VillageDetailContent } from "./village-detail-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Village detail: `ward_village` -> `interview_info`.
 *
 * The village code is the only input, because the tract and township names are
 * resolved client-side. Data fetching happens client-side because the API
 * requires the authenticated token.
 */
export default function VillageDetailPage() {
  return (
    <ProtectedRoute>
      <VillageDetailContent />
    </ProtectedRoute>
  );
}
