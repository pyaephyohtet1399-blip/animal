import { LivestockSection } from "@/components/livestock/livestock-section";
import { DetailList } from "@/components/shared/detail-list";
import { Separator } from "@/components/ui/separator";
import { INTERVIEW_COLUMNS } from "@/config ori/interview";
import type { InterviewInfo } from "@/types/census";
import type { LivestockCensus } from "@/types/livestock";
import type { DetailItem } from "@/types/ui";

export interface InterviewDetailsProps {
  interview: InterviewInfo;
  /** The household's livestock census, already resolved by the data layer. */
  census: LivestockCensus;
}

/**
 * A household interview and its livestock census: who was interviewed, then what
 * was counted.
 *
 * The interview fields are generated from the same column list the table uses,
 * and the `p_Id` join key is shown so the census rows below stay traceable back
 * to `answer`.
 */
export function InterviewDetails({ interview, census }: InterviewDetailsProps) {
  const details: DetailItem[] = [
    ...INTERVIEW_COLUMNS.map((column) => ({
      label: column.label,
      value: interview[column.column],
    })),
    { label: "Record ID (p_Id)", value: interview.p_Id },
  ];

  return (
    <div className="flex flex-col gap-5">
      <DetailList items={details} orientation="stacked" />

      <Separator />

      <LivestockSection census={census} />
    </div>
  );
}
