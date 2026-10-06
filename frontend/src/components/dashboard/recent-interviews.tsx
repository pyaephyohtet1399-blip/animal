import { CountDisplay } from "@/components/livestock/count-display";
import { StatePanel } from "@/components/shared/state-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_COPY } from "@/config/dashboard";
import type { RecentInterview } from "@/types/statistics";

export interface RecentInterviewsProps {
  interviews: RecentInterview[];
}

function villageLabel(interview: RecentInterview): string {
  return interview.villageName ?? interview.wvCode;
}

/**
 * The most recently answered households, with the place each belongs to and what
 * it counted.
 */
export function RecentInterviews({ interviews }: RecentInterviewsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{DASHBOARD_COPY.recentTitle}</CardTitle>
        <CardDescription>{DASHBOARD_COPY.recentDescription}</CardDescription>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {interviews.length === 0 ? (
          <StatePanel
            tone="empty"
            title={DASHBOARD_COPY.recentEmptyTitle}
            description={DASHBOARD_COPY.recentEmptyDescription}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{DASHBOARD_COPY.recentRespondent}</TableHead>
                <TableHead>{DASHBOARD_COPY.recentVillage}</TableHead>
                <TableHead>{DASHBOARD_COPY.recentTownship}</TableHead>
                <TableHead>{DASHBOARD_COPY.recentDate}</TableHead>
                <TableHead className="text-right">
                  {DASHBOARD_COPY.recentLivestock}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow key={interview.p_Id}>
                  <TableCell className="font-medium">{interview.h_name}</TableCell>
                  <TableCell>{villageLabel(interview)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {interview.townshipName ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {interview.ans_date}
                  </TableCell>
                  <TableCell className="text-right">
                    <CountDisplay count={interview.livestockCount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
