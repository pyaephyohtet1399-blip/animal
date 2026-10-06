import type { Metadata } from "next";

import { ReportsContent } from "./reports-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "စစ်တမ်းကောက်ယူမှု အကျဥ်းချုပ်",
  description:
    "မြို့နယ်၊ ကျေးရွာအုပ်စု၊ ကျေးရွာနှင့် တိရစ္ဆာန်အုပ်စုအလိုက် စီစဉ်ထားပြီး စာရွက်စာတမ်းတစ်ခုတည်းအဖြစ် ပုံနှိပ်ထုတ်နိုင်သော စာရင်းဇယား မှတ်တမ်းများ။",
};
 
/**
 * Reports.
 *
 * One scope, several arrangements of the same census records. The selection
 * lives in the URL so a printed document can be reproduced exactly. Data
 * fetching happens client-side because the API requires the authenticated token.
 */
export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}
