export const LIVESTOCK_COPY = {
  sectionTitle: "Livestock census",
  sectionDescription: "Animal counts recorded against this household interview.",
  summaryLabel: "Total livestock",
  summaryAnswers: "Answer records",
  summaryGroups: "Animal groups",
  columnLabels: {
    mainCategory: "Main Category",
    animal: "Animal",
    age: "Age",
    sex: "Sex",
    count: "Count",
  },
  groupHeadingSingular: "animal type",
  groupHeadingPlural: "animal types",
  groupTotal: "Total",
  emptyTitle: "No livestock records",
  emptyDescription:
    "No livestock census answers are stored against this interview.",
  unresolvedWarning:
    "answer rows could not be matched to a category or a restriction, so they are not listed. They are still included in the total above.",
} as const;
