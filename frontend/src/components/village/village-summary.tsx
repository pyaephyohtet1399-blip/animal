import { ClipboardList } from "lucide-react";

import { LocationDetails } from "@/components/explorer/location-details";
import { StatCard } from "@/components/shared/stat-card";
import type { LocationNode } from "@/types/explorer";

export interface VillageSummaryProps {
  village: LocationNode;
  tract: LocationNode;
  township: LocationNode;
  /** Rows in `interview_info` for this village. */
  interviewCount: number;
}

/**
 * What is known about this village before any household is opened: where it
 * sits in the hierarchy, and how many interviews it has.
 */
export function VillageSummary({
  village,
  tract,
  township,
  interviewCount,
}: VillageSummaryProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <LocationDetails
        className="xl:col-span-2"
        title="Village information"
        description="Ward / village record and the units above it."
        village={village}
        tract={tract}
        township={township}
      />

      <StatCard
        label="Interview records"
        labelMm="မေးမြးမှုမှတ်တမ်းများ"
        value={interviewCount}
        icon={ClipboardList}
        hint="Household interviews stored for this village"
      />
    </div>
  );
}
