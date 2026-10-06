import type { Metadata } from "next";

import { CensusContent } from "./census-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "သန်းခေါင်စာရင်း မှတ်တမ်းများ",
  description:
    "ခရိုင်အတွင်းရှိ အိမ်ထောင်စု မေးမြန်းမှုများနှင့် ကောက်ယူထားသော တိရစ္ဆာန် စာရင်းများကို ရှာဖွေခြင်းနှင့် စစ်ထုတ်ခြင်းများ ပြုလုပ်နိုင်ပါသည်။",
};
/**
 * Census records: one row per `interview_info` record, with its geography and
 * livestock resolved.
 *
 * The query lives in the URL, so filtering, sorting and paging happen in the
 * client component. Data fetching happens client-side because the API requires
 * the authenticated token.
 */
export default function CensusPage() {
  return (
    <ProtectedRoute>
      <CensusContent />
    </ProtectedRoute>
  );
}
