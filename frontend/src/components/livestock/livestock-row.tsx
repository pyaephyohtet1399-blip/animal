import { CategoryBadge } from "@/components/livestock/category-badge";
import { CountDisplay } from "@/components/livestock/count-display";
import {
  AgeRestrictionBadge,
  SexRestrictionBadge,
} from "@/components/livestock/restriction-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { LivestockAnswer } from "@/types/livestock";

export interface LivestockRowProps {
  answer: LivestockAnswer;
  /**
   * Rendered by default so the table states the full relationship on its own.
   * `MainCategorySection` turns it off because its own heading already names the
   * group.
   */
  showMainCategory?: boolean;
}

/** One resolved `answer` row. Values are shown exactly as they are stored. */
export function LivestockRow({ answer, showMainCategory = true }: LivestockRowProps) {
  return (
    <TableRow>
      {showMainCategory ? (
        <TableCell>
          <CategoryBadge
            name={answer.mainCategoryName}
            id={answer.mainCategoryId}
          />
        </TableCell>
      ) : null}

      <TableCell>
        <CategoryBadge name={answer.categoryName} id={answer.categoryId} />
      </TableCell>

      <TableCell>
        <AgeRestrictionBadge age={answer.age} />
      </TableCell>

      <TableCell>
        <SexRestrictionBadge sex={answer.sex} />
      </TableCell>

      <TableCell className="text-right">
        <CountDisplay count={answer.count} />
      </TableCell>
    </TableRow>
  );
}
