import type { InterviewColumnKey } from "@/types/interview";

export interface InterviewColumn {
  /** Source column in `interview_info`. */
  column: InterviewColumnKey;
  label: string;
  align?: "left" | "right";
  /** Renders the value in the monospaced face used for codes and dates. */
  mono?: boolean;
  /** Renders the value as the row's primary label. */
  emphasize?: boolean;
}

/**
 * Column order for the household table, in the order it is presented. The same
 * list drives the table header, the cells and the detail panel.
 */
export const INTERVIEW_COLUMNS: InterviewColumn[] = [
  { column: "h_name", label: "ဖြေဆိုသူ ", emphasize: true },
  { column: "h_edu", label: "ပညာရေးအဆင့်" },
  { column: "h_gender", label: "ကျား/မ" },
  { column: "h_phone", label: "ဖုန်းနံပါတ်", mono: true },
  { column: "h_age", label: "အသက်", align: "right" },
  { column: "ans_date", label: "ဖြေဆိုသည့်ရက်စွဲ", mono: true },
];

export const INTERVIEW_COPY = {
  sectionTitle: "အိမ်ထောင်စု မေးမြန်းမှုများ",
  sectionDescription:
    "ဤရပ်ကွက် / ကျေးရွာအတွက် သိမ်းဆည်းထားသော အိမ်ထောင်စု မေးမြန်းမှု မှတ်တမ်းများ။",
  tableCaption: "အိမ်ထောင်စု မေးမြန်းမှု မှတ်တမ်းဇယား",
  emptyTitle: "မေးမြန်းမှု မှတ်တမ်းများ မရှိသေးပါ",
  detailsTitle: "အိမ်ထောင်စု မေးမြန်းချက်",
  editButton: "အသေးစိတ် ပြင်ရန်",
  saveButton: "သိမ်းရန်",
  savingButton: "သိမ်းနေသည်...",
  cancelEdit: "ပယ်ဖျက်",
  editSectionInterview: "ဖြေဆိုသူ အချက်အလက်",
  editSectionLivestock: "မွေးမြူရေး တိရစ္ဆာန် စာရင်း",
  addRow: "တိရစ္ဆာန် ထည့်ရန်",
  removeRow: "ထုတ်ရန်",
  groupEmpty: "ဤအုပ်စုတွင် တိရစ္ဆာန် မှတ်တမ်း မရှိပါ",
  loadingDetail: "အချက်အလက် ရယူနေသည်...",
  formErrors: {
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ",
    phone: "ဖုန်းနံပါတ်တွင် ဂဏန်း၊ +၊ -၊ space များသာ ပါဝင်ရမည်",
    age: "အသက်အား ၀ မှ ၁၅၀ အတွင်း ထည့်ပါ",
    date: "ဖြေဆိုသည့်ရက်စွဲ ဖြည့်ပါ",
    count: "အရေအတွက်အား ၀ မှ 99999 အတွင်း ထည့်ပါ",
    saveFailed: "မသိမ်းနိုင်ပါ — နောက်တစ်ကြိမ် ကြိုးစားပါ",
  },
} as const;