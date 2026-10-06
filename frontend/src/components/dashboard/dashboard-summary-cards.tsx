import { ClipboardList, Landmark, MapPin, PawPrint } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { DASHBOARD_COPY } from "@/config/dashboard";
import type { CensusTotals } from "@/types/statistics";

export interface DashboardSummaryCardsProps {
  totals: CensusTotals;
}

const CARD_ICONS: Record<string, LucideIcon> = {
  townships: Landmark,
  tracts: MapPin,
  villages: MapPin,
  interviews: ClipboardList,
  livestock: PawPrint,
};

/**
 * District totals, one card per census table.
 *
 * Five across on wide screens, three on tablets, two on phones — narrow enough
 * that the longest label ("Total Interview Records") still fits on one line.
 */
export function DashboardSummaryCards({ totals }: DashboardSummaryCardsProps) {
  const cards = [
    { key: "townships", ...DASHBOARD_COPY.cards.townships, value: totals.townshipCount },
    { key: "tracts", ...DASHBOARD_COPY.cards.tracts, value: totals.townVillageCount },
    { key: "villages", ...DASHBOARD_COPY.cards.villages, value: totals.wardVillageCount },
    { key: "interviews", ...DASHBOARD_COPY.cards.interviews, value: totals.interviewCount },
    { key: "livestock", ...DASHBOARD_COPY.cards.livestock, value: totals.livestockCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = CARD_ICONS[card.key];

        return (
          <StatCard
            key={card.key}
            label={card.label}
            labelMm={card.labelMm}
            value={card.value}
            icon={Icon}
          />
        );
      })}
    </div>
  );
}
