import type { ReactNode } from "react";

import { DetailList } from "@/components/shared/detail-list";
import { StatePanel } from "@/components/shared/state-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LocationNode } from "@/types/explorer";
import type { DetailItem } from "@/types/ui";

export interface LocationDetailsProps {
  /** The selected ward / village. */
  village: LocationNode | null;
  /** The tract the village belongs to. */
  tract: LocationNode | null;
  /** The township the tract belongs to. */
  township: LocationNode | null;
  title?: string;
  description?: string;
  /** Rendered below the fields, e.g. a link to the village's own page. */
  action?: ReactNode;
  className?: string;
}

/**
 * Village information card: name, code, and the two parents it sits under.
 *
 * Only fields that exist in the source tables are shown, and the parent codes
 * are read from the same rows as the parent names. Household and livestock
 * census figures are deliberately absent — they arrive with the census phases.
 */
export function LocationDetails({
  village,
  tract,
  township,
  title = "Selected village",
  description = "Ward / village selected in the explorer.",
  action,
  className,
}: LocationDetailsProps) {
  if (!village) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <StatePanel
            tone="empty"
            title="No village selected"
            description="Choose a ward or village in the third column to see its details here."
          />
        </CardContent>
      </Card>
    );
  }

  const details: DetailItem[] = [
    { label: "Village name", value: village.name },
    { label: "Village code", value: village.code },
    { label: "Village tract", value: tract ? `${tract.name} (${tract.code})` : null },
    { label: "Township", value: township ? `${township.name} (${township.code})` : null },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-semibold tracking-tight">{village.name}</span>
          <span className="font-mono text-sm text-muted-foreground">{village.code}</span>
        </div>

        <Separator />

        <DetailList items={details} />

        {action}
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Household and livestock census figures are added in the later census
          phases.
        </p>
      </CardFooter>
    </Card>
  );
}
