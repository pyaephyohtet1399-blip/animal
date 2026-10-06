import { Breadcrumb, type BreadcrumbEntry } from "@/components/ui/breadcrumb";
import { DISTRICT_NAME } from "@/config/app";
import { buildExplorerHref } from "@/lib/explorer";
import type { LocationNode } from "@/types/explorer";

export interface LocationBreadcrumbProps {
  township: LocationNode | null;
  townVillage: LocationNode | null;
  wardVillage: LocationNode | null;
}

/**
 * Geographic trail for the current selection:
 * `Meiktila District / သာစည် / ကန့်ဖြူ / အလယ်`.
 *
 * The district is the fixed root, so only the selected levels appear. Each
 * crumb links to the selection it represents, which is what makes the trail
 * usable for stepping back up the hierarchy.
 */
export function LocationBreadcrumb({
  township,
  townVillage,
  wardVillage,
}: LocationBreadcrumbProps) {
  const items: BreadcrumbEntry[] = [
    { label: DISTRICT_NAME, href: buildExplorerHref({}) },
  ];

  if (township) {
    items.push({
      label: township.name,
      href: buildExplorerHref({ townshipCode: township.code }),
    });
  }

  if (townVillage) {
    items.push({
      label: townVillage.name,
      href: buildExplorerHref({
        townshipCode: township?.code,
        townVillageCode: townVillage.code,
      }),
    });
  }

  if (wardVillage) {
    items.push({ label: wardVillage.name });
  }

  return <Breadcrumb items={items} />;
}