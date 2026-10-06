export const CENSUS_COPY = {
  title: "Census Records",
  titleMm: "သနန်းစာရင်းများ",
  description:
    "Every household interview in the district with the place it belongs to and the livestock counted in it. Search and filter the records, then open one to read its census.",

  search: {
    label: "Search census records",
    placeholder: "Name, village, tract or township",
  },
  /** Chip label for the free-text search. */
  searchChipLabel: "Search",

  filters: {
    township: { label: "Township", all: "All townships" },
    tract: { label: "Village Tract", all: "All tracts" },
    village: { label: "Village", all: "All villages" },
    mainCategory: { label: "Main Category", all: "All animal groups" },
    category: { label: "Category", all: "All animal types" },
    date: { label: "Census date" },
  },

  columns: {
    respondent: "Household / Respondent",
    township: "Township",
    tract: "Village Tract",
    village: "Village",
    censusDate: "Census Date",
    livestock: "Livestock",
    actions: "Actions",
  },

  rowHint: "Open census details",
  emptyTitle: "No census records",
  noMatchTitle: "No records match these filters",
  noMatchDescription:
    "No household interview matches the current search and filters. Widen the date range or clear a filter to see more.",
  clearFilters: "Clear search and filters",
} as const;