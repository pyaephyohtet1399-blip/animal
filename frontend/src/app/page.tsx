import { HomeContent } from "./home-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/**
 * Landing page: scope overview, API endpoints, and design tokens.
 *
 * Data fetching happens client-side because the API requires the authenticated token.
 */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
