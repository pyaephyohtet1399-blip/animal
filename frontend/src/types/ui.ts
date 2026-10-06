/** Small shared UI primitives. Kept intentionally minimal. */

/** Selectable option used by selects, comboboxes and filter controls. */
export interface Option<TValue extends string = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

/** Generic label/value pair used for read-only detail rows. */
export interface DetailItem {
  label: string;
  value: string | number | null;
}

/** Sort state for data tables. */
export interface SortState<TKey extends string = string> {
  key: TKey;
  direction: "asc" | "desc";
}