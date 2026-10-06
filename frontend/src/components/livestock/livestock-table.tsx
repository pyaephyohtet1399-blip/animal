import { LivestockRow } from "@/components/livestock/livestock-row";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LIVESTOCK_COPY } from "@/config/livestock";
import type { LivestockAnswer } from "@/types/livestock";

export interface LivestockTableProps {
  /** Resolved answer rows, all belonging to the same main category. */
  answers: LivestockAnswer[];
  /** Defaults to `true`; see `LivestockRow`. */
  showMainCategory?: boolean;
  caption?: string;
}

/**
 * One main category's worth of rows: Main Category │ Animal │ Age │ Sex │ Count.
 *
 * The headers name the tables the columns come from, so a reader can follow
 * `answer` → `category` → `main_category` and `answer` → `restriction` without
 * leaving the table.
 */
export function LivestockTable({
  answers,
  showMainCategory = true,
  caption,
}: LivestockTableProps) {
  return (
    <Table>
      {caption ? <TableCaption>{caption}</TableCaption> : null}

      <TableHeader>
        <TableRow>
          {showMainCategory ? (
            <TableHead>{LIVESTOCK_COPY.columnLabels.mainCategory}</TableHead>
          ) : null}
          <TableHead>{LIVESTOCK_COPY.columnLabels.animal}</TableHead>
          <TableHead>{LIVESTOCK_COPY.columnLabels.age}</TableHead>
          <TableHead>{LIVESTOCK_COPY.columnLabels.sex}</TableHead>
          <TableHead className="text-right">{LIVESTOCK_COPY.columnLabels.count}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {answers.map((answer) => (
          <LivestockRow
            key={answer.id}
            answer={answer}
            showMainCategory={showMainCategory}
          />
        ))}
      </TableBody>
    </Table>
  );
}
