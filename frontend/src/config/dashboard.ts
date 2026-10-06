export const DASHBOARD_COPY = {
  title: "Dashboard",
  titleMm: "ပင်မဒက်ရှ်ဘုတ်",
  description:
    "ခရိုင်တစ်ဝန်းရှိ စာရင်းကောက်ယူမှု စုစုပေါင်းနှင့် မွေးမြူရေးတိရစ္ဆာန် ဖြန့်ဝေမှု အခြေအနေများ။ စာမျက်နှာဖွင့်လိုက်သည်နှင့် ဂဏန်းအချက်အလက် အားလုံးကို စာရင်းဇယားများမှ အလိုအလျောက် တွက်ချက်ပြသပေးပါသည်။",

  cards: {
    townships: { label: "Total Townships", labelMm: "မြို့နယ်စုစုပေါင်း" },
    tracts: { label: "Total Village Tracts", labelMm: "ကျေးရွာအုပ်စုစုပေါင်း" },
    villages: { label: "Total Villages", labelMm: "ကျေးရွာစုစုပေါင်း" },
    interviews: { label: "Total Interview Records", labelMm: "မေးမြန်းမှု မှတ်တမ်းစုစုပေါင်း" },
    livestock: { label: "Total Livestock", labelMm: "တိရစ္ဆာန်ကောင်ရေ စုစုပေါင်း" },
  },

  charts: {
    livestockByTownship: {
      title: "Livestock by Township",
      titleMm: "မြို့နယ်အလိုက် တိရစ္ဆာန်ကောင်ရေ",
      description: "မြို့နယ်တစ်မြို့နယ်ချင်းစီတွင် စာရင်းကောက်ယူရရှိထားသော တိရစ္ဆာန်ကောင်ရေ စုစုပေါင်း။",
      totalLabel: "စုစုပေါင်း",
    },
    livestockByMainCategory: {
      title: "Livestock by Main Category",
      titleMm: "ပင်မအမျိုးအစားအလိုက် တိရစ္ဆာန်ကောင်ရေ",
      description: "သန်းခေါင်စာရင်း အမျိုးအစားခွဲခြားမှုအတိုင်း တိရစ္ဆာန်အုပ်စုများ။",
      totalLabel: "စုစုပေါင်း",
    },
    livestockByCategory: {
      title: "Livestock by Category",
      titleMm: "အမျိုးအစားအလိုက် တိရစ္ဆာန်ကောင်ရေ",
      description: "အနည်းဆုံး စာရင်းသွင်းထားသော ကောင်ရေ တစ်ခုပါရှိသည့် တိရစ္ဆာန်အမျိုးအစား အားလုံး။",
      totalLabel: "စုစုပေါင်း",
    },
    livestockBySex: {
      title: "Male vs Female",
      titleMm: "အထီး / အမ အလိုက်",
      description: "မှတ်တမ်းတစ်ခုချင်းစီတွင် သိမ်းဆည်းထားသော လိင်အမျိုးအစားအလိုက် ကောင်ရေများ။",
      totalLabel: "စုစုပေါင်း",
    },
    interviewsByTownship: {
      title: "Interview Records by Township",
      titleMm: "မြို့နယ်အလိုက် မေးမြန်းမှုမှတ်တမ်းများ",
      description: "မြို့နယ်တစ်ခုချင်းစီတွင် ကောက်ယူခဲ့သည့် အိမ်ထောင်စု မေးမြန်းမှု မှတ်တမ်းများ။",
      totalLabel: "မှတ်တမ်းများ",
    },
  },

  emptyChartTitle: "စာရင်းသွင်းချက် မရှိသေးပါ",
  emptyChartDescription:
    "သန်းခေါင်စာရင်း ဇယားများတွင် ဤကဲ့သို့သော မှတ်တမ်းများ မရှိသေးပါသဖြင့် ပြသရန် အချက်အလက် မရှိပါ။",

  recentTitle: "လတ်တလော မေးမြန်းမှု မှတ်တမ်းများ",
  recentDescription: "ခရိုင်အတွင်း နောက်ဆုံး မေးမြန်းပြီးစီးခဲ့သော အိမ်ထောင်စုများ။",
  recentVillage: "ကျေးရွာ",
  recentRespondent: "ဖြေဆိုသူ",
  recentDate: "ဖြေဆိုသည့်ရက်စွဲ",
  recentLivestock: "မွေးမြူရေးတိရစ္ဆာန်များ",
  recentTownship: "မြို့နယ်",
  recentEmptyTitle: "မေးမြန်းမှု မှတ်တမ်းများ မရှိသေးပါ",
  recentEmptyDescription: "အိမ်ထောင်စု မေးမြန်းမှု မှတ်တမ်း တစ်စုံတစ်ရာ ထည့်သွင်းထားခြင်း မရှိသေးပါ။",

  livestockTitle: "မွေးမြူရေး အနှစ်ချုပ်",
  livestockDescription: "တိရစ္ဆာန်အုပ်စု တစ်စုချင်းစီက ခရိုင်စုစုပေါင်းတွင် ပါဝင်သည့် ရာခိုင်နှုန်းပမာဏ။",
  livestockShareNote: "ရာခိုင်နှုန်းများသည် တိရစ္ဆာန် စုစုပေါင်းကောင်ရေ {total} အပေါ် မူတည်၍ ပါဝင်သည့် ပမာဏများ ဖြစ်ပါသည်။",
} as const;