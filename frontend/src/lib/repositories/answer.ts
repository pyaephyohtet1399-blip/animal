import answerJson from "@/data/answer.json";
import type { Answer } from "@/types/census";

/** Data access for the `answer` (livestock census count) table. */
export async function getAnswers(): Promise<Answer[]> {
  const rows: Answer[] = answerJson;
  return rows;
}

