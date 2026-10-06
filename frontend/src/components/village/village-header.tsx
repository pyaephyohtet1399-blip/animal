import { LocationBreadcrumb } from "@/components/explorer/location-breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import type { LocationNode } from "@/types/explorer";

export interface VillageHeaderProps {
  village: LocationNode;
  tract: LocationNode;
  township: LocationNode;
}

/**
 * Village page heading: the village name, its code, and the trail that leads to
 * it. The breadcrumb reuses the explorer's, so stepping back up the hierarchy
 * looks and behaves the same on both screens.
 */
export function VillageHeader({ village, tract, township }: VillageHeaderProps) {
  return (
    <PageHeader
      title={village.name}
      subtitle={village.code}
      description="Households interviewed in this ward / village."
      breadcrumb={
        <LocationBreadcrumb
          township={township}
          townVillage={tract}
          wardVillage={village}
        />
      }
    />
  );
}
