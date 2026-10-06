import userJson from "@/data/user.json";

/**
 * Data access for the `user` table.
 *
 * `src/data/user.json` currently ships with zero records, so no column
 * information exists yet. The result is therefore typed as `unknown` and a
 * proper `User` model will be introduced together with the real schema.
 */
export async function getUsers(): Promise<unknown[]> {
  return userJson;
}