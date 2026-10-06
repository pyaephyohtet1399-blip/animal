export const DASHBOARD_COPY = {
  title: "Dashboard",
  titleMm: "ဒက်ဘုတ်",
  description:
    "District-wide census totals and livestock distribution. Every figure is calculated from the census tables when the page is loaded.",

  cards: {
    townships: { label: "Total Townships", labelMm: "မြို့နယ်စုစုပေါင်း" },
    tracts: { label: "Total Village Tracts", labelMm: "ရွာတိုင်းစုစုပေါင်း" },
    villages: { label: "Total Villages", labelMm: "ရွာစုစုပေါင်း" },
    interviews: { label: "Total Interview Records", labelMm: "မေးမြးမှုမှတ်တမ်း" },
    livestock: { label: "Total Livestock", labelMm: "သတ္တါပြည့်စုစုပေါင်း" },
  },

  charts: {
    livestockByTownship: {
      title: "Livestock by Township",
      titleMm: "မြို့နယ်အလိုက် သတ္တါ",
      description: "Sum of the recorded animal counts in each township.",
      totalLabel: "total",
    },
    livestockByMainCategory: {
      title: "Livestock by Main Category",
      titleMm: "အဓိကအမျိုးအစားအလိုက် သတ္တါ",
      description: "Animal groups as defined in the census taxonomy.",
      totalLabel: "total",
    },
    livestockByCategory: {
      title: "Livestock by Category",
      titleMm: "အမျိုးအစားအလိုက် သတ္တါ",
      description: "Every animal type that has at least one recorded count.",
      totalLabel: "total",
    },
    livestockBySex: {
      title: "Male vs Female",
      titleMm: "အထောင် / အမ အလိုက်",
      description: "Counts by the sex code stored on each restriction.",
      totalLabel: "total",
    },
    interviewsByTownship: {
      title: "Interview Records by Township",
      titleMm: "မြို့နယ်အလိုက် မေးမြးမှု",
      description: "Household interviews recorded in each township.",
      totalLabel: "records",
    },
  },

  emptyChartTitle: "Nothing recorded yet",
  emptyChartDescription:
    "No records of this kind exist in the census tables yet, so there is nothing to plot.",

  recentTitle: "Recent interview records",
  recentDescription: "Most recently answered households across the district.",
  recentVillage: "Village",
  recentRespondent: "Respondent",
  recentDate: "Answer date",
  recentLivestock: "Livestock",
  recentTownship: "Township",
  recentEmptyTitle: "No interview records",
  recentEmptyDescription: "No household interview has been recorded yet.",

  livestockTitle: "Livestock summary",
  livestockDescription: "Share of the district total held by each animal group.",
  livestockShareNote: "Percentages are shares of the district total of {total} animals.",
} as const;
