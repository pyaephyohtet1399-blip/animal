/**
 * WDN Survey - 246 Columns Definition
 * Each column maps: key (English safe key), labelMm (Myanmar header)
 */

export interface WdnColumnDef {
  /** English key used internally */
  key: string;
  /** Myanmar label shown in Excel header */
  labelMm: string;
  /** Optional width for Excel column */
  width?: number;
}

export const WDN_COLUMNS: WdnColumnDef[] = [
  // ─────────────────────────────────────────────
  // 1–16: Respondent / Household Info
  // ─────────────────────────────────────────────
  { key: "district", labelMm: "ခရိုင်", width: 18 },
  { key: "township", labelMm: "မြို့နယ်", width: 18 },
  { key: "villageTract", labelMm: "ကျေးရွာ အုပ်စု", width: 20 },
  { key: "villageWard", labelMm: "ရပ်ကွက်/ ကျေးရွာ", width: 20 },
  { key: "householdNo", labelMm: "အိမ်ထောင်စု အမှတ်စဉ်", width: 12 },
  { key: "interviewDate", labelMm: "တွေ့ဆုံ မေးမြန်း သည့်နေ့", width: 16 },
  { key: "respondentName", labelMm: "ဖြေဆိုသူ အမည်", width: 22 },
  { key: "gender", labelMm: "ကျား/မ", width: 10 },
  { key: "age", labelMm: "အသက် (နှစ်)", width: 10 },
  { key: "education", labelMm: "ပညာ အရည်အချင်း", width: 18 },
  { key: "phone", labelMm: "ဖုန်းနံပါတ်", width: 16 },
  { key: "householdHeadName", labelMm: "အိမ်ထောင် ဦးစီး အမည်", width: 22 },
  { key: "gender1", labelMm: "ကျား/မ.1", width: 10 },
  { key: "age1", labelMm: "အသက် (နှစ်).1", width: 10 },
  { key: "education1", labelMm: "ပညာ အရည်အချင်း.1", width: 18 },
  { key: "phone1", labelMm: "ဖုန်းနံပါတ်.1", width: 16 },

  // ─────────────────────────────────────────────
  // 17–27: ဒေသနွား (Local Cattle)
  // ─────────────────────────────────────────────
  { key: "localCattleBreed", labelMm: "ဒေသနွား မျိုး", width: 18 },
  { key: "localCattleUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး _ဒေသနွား", width: 14 },
  { key: "localCattleUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ် အထီး _ဒေသနွား", width: 14 },
  { key: "localCattleUnder1Female", labelMm: "(၁)နှစ်အောက် အမ _ဒေသနွား", width: 14 },
  { key: "localCattle1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး _ဒေသနွား", width: 14 },
  { key: "localCattle1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ် အထီး _ ဒေသနွား", width: 14 },
  { key: "localCattle1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ _ဒေသနွား", width: 14 },
  { key: "localCattleOver3Male", labelMm: "(၃) နှစ်အထက် အထီး _ဒေသနွား", width: 14 },
  { key: "localCattleOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ် အထီး _ ဒေသနွား", width: 14 },
  { key: "localCattleOver3Female", labelMm: "(၃) နှစ်အထက် အမ _ဒေသနွား", width: 14 },
  { key: "localCattleTotal", labelMm: "ဒေသနွား စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 28–38: အသားစားနွား (Beef Cattle)
  // ─────────────────────────────────────────────
  { key: "beefCattleBreed", labelMm: "အသားစားနွား မျိုး", width: 18 },
  { key: "beefCattleUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး _အသားစားနွား", width: 14 },
  { key: "beefCattleUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ် အထီး _အသားစားနွား", width: 14 },
  { key: "beefCattleUnder1Female", labelMm: "(၁)နှစ်အောက် အမ _အသားစားနွား", width: 14 },
  { key: "beefCattle1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး _အသားစားနွား", width: 14 },
  { key: "beefCattle1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ် အထီး _ အသားစားနွား", width: 14 },
  { key: "beefCattle1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ _အသားစားနွား", width: 14 },
  { key: "beefCattleOver3Male", labelMm: "(၃) နှစ်အထက် အထီး _အသားစားနွား", width: 14 },
  { key: "beefCattleOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ် အထီး _ အသားစားနွား", width: 14 },
  { key: "beefCattleOver3Female", labelMm: "(၃) နှစ်အထက် အမ _အသားစားနွား", width: 14 },
  { key: "beefCattleTotal", labelMm: "အသားစားနွား စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 39–49: နို့စားနွား (Dairy Cattle)
  // ─────────────────────────────────────────────
  { key: "dairyCattleBreed", labelMm: "နို့စားနွား မျိုး", width: 18 },
  { key: "dairyCattleUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး _နို့စားနွား", width: 14 },
  { key: "dairyCattleUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ် အထီး _နို့စားနွား", width: 14 },
  { key: "dairyCattleUnder1Female", labelMm: "(၁)နှစ်အောက် အမ _နို့စားနွား", width: 14 },
  { key: "dairyCattle1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး _နို့စားနွား", width: 14 },
  { key: "dairyCattle1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ် အထီး _ နို့စားနွား", width: 14 },
  { key: "dairyCattle1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ _နို့စားနွား", width: 14 },
  { key: "dairyCattleOver3Male", labelMm: "(၃) နှစ်အထက် အထီး _နို့စားနွား", width: 14 },
  { key: "dairyCattleOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ် အထီး _ နို့စားနွား", width: 14 },
  { key: "dairyCattleOver3Female", labelMm: "(၃) နှစ်အထက် အမ _နို့စားနွား", width: 14 },
  { key: "dairyCattleTotal", labelMm: "နို့စားနွား စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 50–60: နွားနောက် (Buffalo - Male/Working)
  // ─────────────────────────────────────────────
  { key: "buffaloBreed", labelMm: "နွားနောက် မျိုး", width: 18 },
  { key: "buffaloUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး _နွားနောက်", width: 14 },
  { key: "buffaloUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ် အထီး _နွားနောက်", width: 14 },
  { key: "buffaloUnder1Female", labelMm: "(၁)နှစ်အောက် အမ _နွားနောက်", width: 14 },
  { key: "buffalo1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး _နွားနောက်", width: 14 },
  { key: "buffalo1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ် အထီး _ နွားနောက်", width: 14 },
  { key: "buffalo1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ _နွားနောက်", width: 14 },
  { key: "buffaloOver3Male", labelMm: "(၃) နှစ်အထက် အထီး _နွားနောက်", width: 14 },
  { key: "buffaloOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ် အထီး _ နွားနောက်", width: 14 },
  { key: "buffaloOver3Female", labelMm: "(၃) နှစ်အထက် အမ _နွားနောက်", width: 14 },
  { key: "buffaloTotal", labelMm: "နွားနောက် စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 61–71: ခိုင်းကျွဲ (Working Buffalo)
  // ─────────────────────────────────────────────
  { key: "workingBuffaloBreed", labelMm: "ခိုင်းကျွဲ မျိုး", width: 18 },
  { key: "workingBuffaloUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ် အထီး _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloUnder1Female", labelMm: "(၁)နှစ်အောက် အမ _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffalo1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffalo1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ် အထီး _ ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffalo1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloOver3Male", labelMm: "(၃) နှစ်အထက် အထီး _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ် အထီး _ ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloOver3Female", labelMm: "(၃) နှစ်အထက် အမ _ခိုင်းကျွဲ", width: 14 },
  { key: "workingBuffaloTotal", labelMm: "ခိုင်းကျွဲ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 72–82: နို့စားကျွဲ (Dairy Buffalo)
  // ─────────────────────────────────────────────
  { key: "dairyBuffaloBreed", labelMm: "နို့စားကျွဲ မျိုး", width: 18 },
  { key: "dairyBuffaloUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ်အထီး_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloUnder1Female", labelMm: "(၁)နှစ်အောက် အမ_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffalo1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffalo1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ်အထီး_ နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffalo1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloOver3Male", labelMm: "(၃) နှစ်အထက် အထီး_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ်အထီး_ နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloOver3Female", labelMm: "(၃) နှစ်အထက် အမ_နို့စားကျွဲ", width: 14 },
  { key: "dairyBuffaloTotal", labelMm: "နို့စားကျွဲ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 83–93: မြင်း (Horse)
  // ─────────────────────────────────────────────
  { key: "horseBreed", labelMm: "မြင်း မျိုး", width: 18 },
  { key: "horseUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး_မြင်း", width: 14 },
  { key: "horseUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ်အထီး_မြင်း", width: 14 },
  { key: "horseUnder1Female", labelMm: "(၁)နှစ်အောက် အမ_မြင်း", width: 14 },
  { key: "horse1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး_မြင်း", width: 14 },
  { key: "horse1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ်အထီး_ မြင်း", width: 14 },
  { key: "horse1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ_မြင်း", width: 14 },
  { key: "horseOver3Male", labelMm: "(၃) နှစ်အထက် အထီး_မြင်း", width: 14 },
  { key: "horseOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ်အထီး_ မြင်း", width: 14 },
  { key: "horseOver3Female", labelMm: "(၃) နှစ်အထက် အမ_မြင်း", width: 14 },
  { key: "horseTotal", labelMm: "မြင်း စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 94–104: အခြား (Other Large Animals)
  // ─────────────────────────────────────────────
  { key: "otherLargeBreed", labelMm: "အခြား မျိုး", width: 18 },
  { key: "otherLargeUnder1Male", labelMm: "(၁)နှစ်အောက် အထီး_အခြား", width: 14 },
  { key: "otherLargeUnder1CastratedMale", labelMm: "(၁)နှစ်အောက် သင်းကွပ်အထီး_အခြား", width: 14 },
  { key: "otherLargeUnder1Female", labelMm: "(၁)နှစ်အောက် အမ_အခြား", width: 14 },
  { key: "otherLarge1to3Male", labelMm: "(၁)နှစ်မှ (၃)နှစ် အထီး_အခြား", width: 14 },
  { key: "otherLarge1to3CastratedMale", labelMm: "(၁)နှစ်မှ (၃)နှစ် သင်းကွပ်အထီး_ အခြား", width: 14 },
  { key: "otherLarge1to3Female", labelMm: "(၁)နှစ်မှ (၃)နှစ် အမ_အခြား", width: 14 },
  { key: "otherLargeOver3Male", labelMm: "(၃) နှစ်အထက် အထီး_အခြား", width: 14 },
  { key: "otherLargeOver3CastratedMale", labelMm: "(၃) နှစ်အထက် သင်းကွပ်အထီး_ အခြား", width: 14 },
  { key: "otherLargeOver3Female", labelMm: "(၃) နှစ်အထက် အမ_အခြား", width: 14 },
  { key: "otherLargeTotal", labelMm: "အခြားစုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 105–115: ဆိတ် (Goat)
  // ─────────────────────────────────────────────
  { key: "goatBreed", labelMm: "ဆိတ် မျိုး", width: 18 },
  { key: "goatUnder2mMale", labelMm: "(၂) လအောက် အထီး_ဆိတ်", width: 14 },
  { key: "goatUnder2mCastratedMale", labelMm: "(၂) လအောက်သင်းကွပ်အထီး_ဆိတ်", width: 14 },
  { key: "goatUnder2mFemale", labelMm: "(၂) လအောက် အမ_ဆိတ်", width: 14 },
  { key: "goat2to6mMale", labelMm: "(၂) လ မှ (၆) လ အထီး_ဆိတ်", width: 14 },
  { key: "goat2to6mCastratedMale", labelMm: "(၂) လ မှ (၆) လ သင်းကွပ်အထီး_ဆိတ်", width: 14 },
  { key: "goat2to6mFemale", labelMm: "(၂) လ မှ (၆) လ အမ_ဆိတ်", width: 14 },
  { key: "goatOver6mMale", labelMm: "(၆) လအထက် အထီး_ဆိတ်", width: 14 },
  { key: "goatOver6mCastratedMale", labelMm: "(၆) လအထက် သင်းကွပ်အထီး_ဆိတ်", width: 14 },
  { key: "goatOver6mFemale", labelMm: "(၆) လအထက် အမ_ဆိတ်", width: 14 },
  { key: "goatTotal", labelMm: "ဆိတ်စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 116–126: သိုး (Sheep)
  // ─────────────────────────────────────────────
  { key: "sheepBreed", labelMm: "သိုး မျိုး", width: 18 },
  { key: "sheepUnder2mMale", labelMm: "(၂) လအောက် အထီး_သိုး", width: 14 },
  { key: "sheepUnder2mCastratedMale", labelMm: "(၂) လအောက်သင်းကွပ်အထီး_သိုး", width: 14 },
  { key: "sheepUnder2mFemale", labelMm: "(၂) လအောက် အမ_သိုး", width: 14 },
  { key: "sheep2to6mMale", labelMm: "(၂) လ မှ (၆) လ အထီး_သိုး", width: 14 },
  { key: "sheep2to6mCastratedMale", labelMm: "(၂) လ မှ (၆) လ သင်းကွပ်အထီး_သိုး", width: 14 },
  { key: "sheep2to6mFemale", labelMm: "(၂) လ မှ (၆) လ အမ_သိုး", width: 14 },
  { key: "sheepOver6mMale", labelMm: "(၆) လအထက် အထီး_သိုး", width: 14 },
  { key: "sheepOver6mCastratedMale", labelMm: "(၆) လအထက် သင်းကွပ်အထီး_သိုး", width: 14 },
  { key: "sheepOver6mFemale", labelMm: "(၆) လအထက် အမ_သိုး", width: 14 },
  { key: "sheepTotal", labelMm: "သိုး စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 127–137: ဝက် (Pig)
  // ─────────────────────────────────────────────
  { key: "pigBreed", labelMm: "ဝက် မျိုး", width: 18 },
  { key: "pigUnder2mMale", labelMm: "(၂) လအောက် အထီး_ဝက်", width: 14 },
  { key: "pigUnder2mCastratedMale", labelMm: "(၂) လအောက်သင်းကွပ်အထီး_ဝက်", width: 14 },
  { key: "pigUnder2mFemale", labelMm: "(၂) လအောက် အမ_ဝက်", width: 14 },
  { key: "pig2to6mMale", labelMm: "(၂) လ မှ (၆) လ အထီး_ဝက်", width: 14 },
  { key: "pig2to6mCastratedMale", labelMm: "(၂) လ မှ (၆) လ သင်းကွပ်အထီး_ဝက်", width: 14 },
  { key: "pig2to6mFemale", labelMm: "(၂) လ မှ (၆) လ အမ_ဝက်", width: 14 },
  { key: "pigOver6mMale", labelMm: "(၆) လအထက် အထီး_ဝက်", width: 14 },
  { key: "pigOver6mCastratedMale", labelMm: "(၆) လအထက် သင်းကွပ်အထီး_ဝက်", width: 14 },
  { key: "pigOver6mFemale", labelMm: "(၆) လအထက် အမ_ဝက်", width: 14 },
  { key: "pigTotal", labelMm: "ဝက် စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 138–148: ခွေး (Dog)
  // ─────────────────────────────────────────────
  { key: "dogBreed", labelMm: "ခွေး မျိုး", width: 18 },
  { key: "dogUnder2mMale", labelMm: "(၂) လအောက် အထီး_ခွေး", width: 14 },
  { key: "dogUnder2mCastratedMale", labelMm: "(၂) လအောက်သင်းကွပ်အထီး_ခွေး", width: 14 },
  { key: "dogUnder2mFemale", labelMm: "(၂) လအောက် အမ_ခွေး", width: 14 },
  { key: "dog2to6mMale", labelMm: "(၂) လ မှ (၆) လ အထီး_ခွေး", width: 14 },
  { key: "dog2to6mCastratedMale", labelMm: "(၂) လ မှ (၆) လ သင်းကွပ်အထီး_ခွေး", width: 14 },
  { key: "dog2to6mFemale", labelMm: "(၂) လ မှ (၆) လ အမ_ခွေး", width: 14 },
  { key: "dogOver6mMale", labelMm: "(၆) လအထက် အထီး_ခွေး", width: 14 },
  { key: "dogOver6mCastratedMale", labelMm: "(၆) လအထက် သင်းကွပ်အထီး_ခွေး", width: 14 },
  { key: "dogOver6mFemale", labelMm: "(၆) လအထက် အမ_ခွေး", width: 14 },
  { key: "dogTotal", labelMm: "ခွေးစုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 149–159: အခြား (Other Small - 2)
  // ─────────────────────────────────────────────
  { key: "otherSmall2Breed", labelMm: "အခြား မျိုး.1", width: 18 },
  { key: "otherSmall2Under2mMale", labelMm: "(၂) လအောက် အထီး_အခြား", width: 14 },
  { key: "otherSmall2Under2mCastratedMale", labelMm: "(၂) လအောက်သင်းကွပ်အထီး_အခြား", width: 14 },
  { key: "otherSmall2Under2mFemale", labelMm: "(၂) လအောက် အမ_အခြား", width: 14 },
  { key: "otherSmall2_2to6mMale", labelMm: "(၂) လ မှ (၆) လ အထီး_အခြား", width: 14 },
  { key: "otherSmall2_2to6mCastratedMale", labelMm: "(၂) လ မှ (၆) လ သင်းကွပ်အထီး_အခြား", width: 14 },
  { key: "otherSmall2_2to6mFemale", labelMm: "(၂) လ မှ (၆) လ အမ_အခြား", width: 14 },
  { key: "otherSmall2Over6mMale", labelMm: "(၆) လအထက် အထီး_အခြား", width: 14 },
  { key: "otherSmall2Over6mCastratedMale", labelMm: "(၆) လအထက် သင်းကွပ်အထီး_အခြား", width: 14 },
  { key: "otherSmall2Over6mFemale", labelMm: "(၆) လအထက် အမ_အခြား", width: 14 },
  { key: "otherSmall2Total", labelMm: "အခြားစုစုပေါင်း.1", width: 14 },

  // ─────────────────────────────────────────────
  // 160–167: ဉစားကြက် (Egg-laying Chicken)
  // ─────────────────────────────────────────────
  { key: "layerChickenBreed", labelMm: "ဉစားကြက် မျိုး", width: 18 },
  { key: "layerChickenSmallMale", labelMm: "ငယ် အထီး", width: 12 },
  { key: "layerChickenSmallFemale", labelMm: "ငယ် အမ", width: 12 },
  { key: "layerChickenMediumMale", labelMm: "လတ် အထီး", width: 12 },
  { key: "layerChickenMediumFemale", labelMm: "လတ် အမ", width: 12 },
  { key: "layerChickenLargeMale", labelMm: "ကြီး အထီး", width: 12 },
  { key: "layerChickenLargeFemale", labelMm: "ကြီး အမ", width: 12 },
  { key: "layerChickenTotal", labelMm: "ဉစားကြက် စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 168–169: အသားစားကြက် (Broiler Chicken)
  // ─────────────────────────────────────────────
  { key: "broilerChickenBreed", labelMm: "အသားစားကြက် မျိုး", width: 18 },
  { key: "broilerChickenTotal", labelMm: "အသားစားကြက် စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 170–174: ဒေသကြက် (Local Chicken)
  // ─────────────────────────────────────────────
  { key: "localChickenBreed", labelMm: "ဒေသကြက် မျိုး", width: 18 },
  { key: "localChickenSmallMedium", labelMm: "ဒေသကြက်ငယ်+လတ်", width: 16 },
  { key: "localChickenLargeMale", labelMm: "ဒေသကြက်ဖကြီး", width: 14 },
  { key: "localChickenLargeFemale", labelMm: "ဒေသကြက်မကြီး", width: 14 },
  { key: "localChickenTotal", labelMm: "ဒေသကြက်စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 175–182: ဉစားဘဲ (Egg-laying Duck)
  // ─────────────────────────────────────────────
  { key: "layerDuckBreed", labelMm: "ဉစားဘဲ မျိုး", width: 18 },
  { key: "layerDuckSmallMale", labelMm: "ငယ် အထီး -ဉစားဘဲ", width: 14 },
  { key: "layerDuckSmallFemale", labelMm: "ငယ် အမ -ဉစားဘဲ", width: 14 },
  { key: "layerDuckImmatureMale", labelMm: "မတမ်း အထီး -ဉစားဘဲ", width: 14 },
  { key: "layerDuckImmatureFemale", labelMm: "မတမ်း အမ -ဉစားဘဲ", width: 14 },
  { key: "layerDuckLargeMale", labelMm: "ကြီး အထီး.1", width: 14 },
  { key: "layerDuckLargeFemale", labelMm: "ကြီး အမ.1", width: 14 },
  { key: "layerDuckTotal", labelMm: "ဉစားဘဲ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 183–184: အသားစားဘဲ (Meat Duck)
  // ─────────────────────────────────────────────
  { key: "meatDuckBreed", labelMm: "အသားစားဘဲ မျိုး", width: 18 },
  { key: "meatDuckTotal", labelMm: "အသားစားဘဲ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 185–192: ဒေသဘဲ (Local Duck)
  // ─────────────────────────────────────────────
  { key: "localDuckBreed", labelMm: "ဒေသဘဲ မျိုး", width: 18 },
  { key: "localDuckSmallMale", labelMm: "ဘဲငယ်(အထီး)_ဒေသဘဲ", width: 14 },
  { key: "localDuckSmallFemale", labelMm: "ဘဲငယ်(အမ)_ဒေသဘဲ", width: 14 },
  { key: "localDuckImmatureMale", labelMm: "မတမ်း(အထီး)_ဒေသဘဲ", width: 14 },
  { key: "localDuckImmatureFemale", labelMm: "မတမ်း(အမ)_ဒေသဘဲ", width: 14 },
  { key: "localDuckLayerMale", labelMm: "အုဘဲ(အထီး)_ဒေသဘဲ", width: 14 },
  { key: "localDuckLayerFemale", labelMm: "အုဘဲ(အမ)_ဒေသဘဲ", width: 14 },
  { key: "localDuckTotal", labelMm: "ဒေသဘဲ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 193–200: ကြက်ဆင် (Turkey)
  // ─────────────────────────────────────────────
  { key: "turkeyBreed", labelMm: "ကြက်ဆင် မျိုး", width: 18 },
  { key: "turkeySmallMale", labelMm: "ငယ်(အထီး)_ကြက်ဆင်", width: 14 },
  { key: "turkeySmallFemale", labelMm: "ငယ်(အမ)_ကြက်ဆင်", width: 14 },
  { key: "turkeyImmatureMale", labelMm: "မတမ်း(အထီး)_ကြက်ဆင်", width: 14 },
  { key: "turkeyImmatureFemale", labelMm: "မတမ်း(အမ)-ကြက်ဆင်", width: 14 },
  { key: "turkeyLargeMale", labelMm: "ကြီး(အထီး)_ကြက်ဆင်", width: 14 },
  { key: "turkeyLargeFemale", labelMm: "ကြီး(အမ)_ကြက်ဆင်", width: 14 },
  { key: "turkeyTotal", labelMm: "ကြက်ဆင် စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 201–208: ဘဲငန်း (Goose)
  // ─────────────────────────────────────────────
  { key: "gooseBreed", labelMm: "ဘဲငန်း မျိုး", width: 18 },
  { key: "gooseSmallMale", labelMm: "ဘဲငယ်(အထီး)_ဘဲငန်း", width: 14 },
  { key: "gooseSmallFemale", labelMm: "ဘဲငယ်(အမ)_ဘဲငန်း", width: 14 },
  { key: "gooseImmatureMale", labelMm: "မတမ်း(အထီး)_ဘဲငန်း", width: 14 },
  { key: "gooseImmatureFemale", labelMm: "မတမ်း(အမ)_ဘဲငန်း", width: 14 },
  { key: "gooseLayerMale", labelMm: "အုဘဲ(အထီး)_ဘဲငန်း", width: 14 },
  { key: "gooseLayerFemale", labelMm: "အုဘဲ(အမ)_ဘဲငန်း", width: 14 },
  { key: "gooseTotal", labelMm: "ဘဲငန်း စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 209–216: မန်ဒါလီ (Mandarin Duck)
  // ─────────────────────────────────────────────
  { key: "mandarinBreed", labelMm: "မန်ဒါလီ မျိုး", width: 18 },
  { key: "mandarinSmallMale", labelMm: "ဘဲငယ်(အထီး)_မန်ဒါလီ", width: 14 },
  { key: "mandarinSmallFemale", labelMm: "ဘဲငယ်(အမ)_မန်ဒါလီ", width: 14 },
  { key: "mandarinImmatureMale", labelMm: "မတမ်း(အထီး)_မန်ဒါလီ", width: 14 },
  { key: "mandarinImmatureFemale", labelMm: "မတမ်း(အမ)_မန်ဒါလီ", width: 14 },
  { key: "mandarinLayerMale", labelMm: "အုဘဲ(အထီး)_မန်ဒါလီ", width: 14 },
  { key: "mandarinLayerFemale", labelMm: "အုဘဲ(အမ)_မန်ဒါလီ", width: 14 },
  { key: "mandarinTotal", labelMm: "မန်ဒါလီ စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 217–224: ငုံး (Quail)
  // ─────────────────────────────────────────────
  { key: "quailBreed", labelMm: "ငုံး မျိုး", width: 18 },
  { key: "quailSmallMale", labelMm: "ငုံးငယ်(အထီး)_ငုံး", width: 14 },
  { key: "quailSmallFemale", labelMm: "ငုံးငယ်(အမ)_ငုံး", width: 14 },
  { key: "quailImmatureMale", labelMm: "မတမ်း(အထီး)_ငုံး", width: 14 },
  { key: "quailImmatureFemale", labelMm: "မတမ်း(အမ)_ငုံး", width: 14 },
  { key: "quailLayerMale", labelMm: "အုငုံး(အထီး)_ငုံး", width: 14 },
  { key: "quailLayerFemale", labelMm: "အုငုံး(အမ)_ငုံး", width: 14 },
  { key: "quailTotal", labelMm: "ငုံး စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 225–232: အခြား (Other Poultry - 3)
  // ─────────────────────────────────────────────
  { key: "otherPoultry3Breed", labelMm: "အခြား မျိုး.2", width: 18 },
  { key: "otherPoultry3SmallMale", labelMm: "ငယ်(အထီး)_အခြား", width: 14 },
  { key: "otherPoultry3SmallFemale", labelMm: "ငယ်(အမ)_အခြား", width: 14 },
  { key: "otherPoultry3ImmatureMale", labelMm: "မတမ်း(အထီး)_အခြား", width: 14 },
  { key: "otherPoultry3ImmatureFemale", labelMm: "မတမ်း(အမ)_အခြား", width: 14 },
  { key: "otherPoultry3LargeMale", labelMm: "ကြီး (အထီး) _အခြား", width: 14 },
  { key: "otherPoultry3LargeFemale", labelMm: "ကြီး (အမ) _အခြား", width: 14 },
  { key: "otherPoultry3Total", labelMm: "အခြား စုစုပေါင်း", width: 14 },

  // ─────────────────────────────────────────────
  // 233–244: မျိုးတိရစ္ဆာန် (Breeding Animals)
  // ─────────────────────────────────────────────
  { key: "breedingLocalCattleMale", labelMm: "မျိုးတိရစ္ဆာန် ဒေသနွား -အထီး", width: 16 },
  { key: "breedingLocalCattleFemale", labelMm: "မျိုးတိရစ္ဆာန် ဒေသနွား -အမ", width: 16 },
  { key: "breedingLocalBuffaloMale", labelMm: "မျိုးတိရစ္ဆာန် ဒေသကျွဲ -အထီး", width: 16 },
  { key: "breedingLocalBuffaloFemale", labelMm: "မျိုးတိရစ္ဆာန် ဒေသကျွဲ -အမ", width: 16 },
  { key: "breedingDairyBuffaloMale", labelMm: "မျိုးတိရစ္ဆာန် နို့စားကျွဲ -အထီး", width: 16 },
  { key: "breedingDairyBuffaloFemale", labelMm: "မျိုးတိရစ္ဆာန် နို့စားကျွဲ -အမ", width: 16 },
  { key: "breedingPigMale", labelMm: "မျိုးတိရစ္ဆာန် ဝက် -အထီး", width: 16 },
  { key: "breedingPigFemale", labelMm: "မျိုးတိရစ္ဆာန် ဝက် -အမ", width: 16 },
  { key: "breedingGoatMale", labelMm: "မျိုးတိရစ္ဆာန် ဆိတ် -အထီး", width: 16 },
  { key: "breedingGoatFemale", labelMm: "မျိုးတိရစ္ဆာန် ဆိတ် -အမ", width: 16 },
  { key: "breedingSheepMale", labelMm: "မျိုးတိရစ္ဆာန် သိုး -အထီး", width: 16 },
  { key: "breedingSheepFemale", labelMm: "မျိုးတိရစ္ဆာန် သိုး -အမ", width: 16 },

  // ─────────────────────────────────────────────
  // 245–246: Interviewer Info
  // ─────────────────────────────────────────────
  { key: "interviewerName", labelMm: "မေးမြန်းသူ အမည်", width: 22 },
  { key: "phone2", labelMm: "ဖုန်းနံပါတ်.2", width: 16 },
];

export const WDN_COLUMN_COUNT = 246;

// Validation (dev-only guard)
if (
  process.env.NODE_ENV !== "production" &&
  WDN_COLUMNS.length !== WDN_COLUMN_COUNT
) {
  console.warn(
    `[WDN] Expected ${WDN_COLUMN_COUNT} columns, got ${WDN_COLUMNS.length}. Please complete the list.`
  );
}