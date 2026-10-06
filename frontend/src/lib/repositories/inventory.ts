import { getAnswers } from "@/lib/repositories/answer";
import { getCategories, getMainCategories } from "@/lib/repositories/category";
import { getInterviews } from "@/lib/repositories/interview";
import { getRestrictions } from "@/lib/repositories/restriction";
import { getTownVillages } from "@/lib/repositories/town-village";
import { getTownships } from "@/lib/repositories/township";
import { getUsers } from "@/lib/repositories/user";
import { getWardVillages } from "@/lib/repositories/ward-village";

export interface DataSourceEntry {
  /** Database table the JSON file stands in for. */
  table: string;
  /** JSON file inside `src/data`. */
  file: string;
  /** What the table represents in the census hierarchy. */
  role: string;
  records: number;
}

/**
 * Record count per backing table. Derived from the repositories so it can never
 * drift away from the actual mock data.
 */
export async function getDataSourceInventory(): Promise<DataSourceEntry[]> {
  const [
    townships,
    townVillages,
    wardVillages,
    interviews,
    mainCategories,
    categories,
    restrictions,
    answers,
    users,
  ] = await Promise.all([
    getTownships(),
    getTownVillages(),
    getWardVillages(),
    getInterviews(),
    getMainCategories(),
    getCategories(),
    getRestrictions(),
    getAnswers(),
    getUsers(),
  ]);

  return [
    { table: "user", file: "user.json", role: "System users", records: users.length },
    { table: "township", file: "township.json", role: "Township", records: townships.length },
    {
      table: "town_vg",
      file: "town_vg.json",
      role: "Town / Village Tract",
      records: townVillages.length,
    },
    {
      table: "ward_village",
      file: "ward_village.json",
      role: "Ward / Village",
      records: wardVillages.length,
    },
    {
      table: "interview_info",
      file: "interview_info.json",
      role: "Household interview",
      records: interviews.length,
    },
    {
      table: "main_category",
      file: "main_category.json",
      role: "Animal group",
      records: mainCategories.length,
    },
    {
      table: "category",
      file: "category.json",
      role: "Animal type",
      records: categories.length,
    },
    {
      table: "restriction",
      file: "restriction.json",
      role: "Age / sex / size rule",
      records: restrictions.length,
    },
    {
      table: "answer",
      file: "answer.json",
      role: "Census count per household",
      records: answers.length,
    },
  ];
}