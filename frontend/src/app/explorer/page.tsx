import type { Metadata } from "next";

import { ExplorerContent } from "./explorer-content";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DISTRICT_NAME } from "@/config/app";

export const metadata: Metadata = {
  title: "ဒေတာရှာဖွေစူးစမ်းရန်",
  description: `${DISTRICT_NAME}အတွင်းရှိ မြို့နယ်များ၊ မြို့နှင့် ကျေးရွာအုပ်စုများ၊ ရပ်ကွက်များနှင့် ကျေးရွာများကို ကြည့်ရှုစစ်ဆေးပါ။`,
};

/**
 * Livestock database explorer: District > Township > Town / Village Tract >
 * Ward / Village.
 *
 * The selection is held in the URL (`?tsp=&tvg=&wv=`), so every view is
 * shareable and the back button works. Data fetching happens client-side
 * because the API requires the authenticated token.
 */
export default function ExplorerPage() {
  return (
    <ProtectedRoute>
      <ExplorerContent />
    </ProtectedRoute>
  );
}
