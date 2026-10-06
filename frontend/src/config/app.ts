/** Application level constants. Single source of truth for branding and scope. */

export const APP_NAME = "Livestock Census Management System";
export const APP_SHORT_NAME = "Livestock Census";

export const DISTRICT_NAME = "Meiktila District";
export const DISTRICT_NAME_MM = "မိတ္ထီလာခရိုင်";
export const COUNTRY_NAME = "Myanmar";

/** Phase 01 ships mock data only; no backend is connected yet. */
export const DATA_SOURCE_LABEL = "Mock data (JSON)";

/**
 * Delivery phase currently implemented. Surfaced in the sidebar footer so the
 * build state is visible without opening the README.
 */
export const CURRENT_PHASE = "Phase 09";
export const CURRENT_PHASE_LABEL = "Reusable Component Refactoring";

/** Ordered geography chain, top to bottom. */
export const GEOGRAPHY_CHAIN = [
  "District",
  "Township",
  "Town / Village Tract",
  "Ward / Village",
  "Household / Interview",
  "Livestock Census",
] as const;