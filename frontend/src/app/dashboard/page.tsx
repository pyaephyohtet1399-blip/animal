import type { Metadata } from "next";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "ပင်မဒက်ရှ်ဘုတ်",
  description: "ခရိုင်တစ်ဝန်းရှိ သန်းခေါင်စာရင်း စုစုပေါင်းများနှင့် မွေးမြူရေးတိရစ္ဆာန် ဖြန့်ဝေမှု အခြေအနေများ။",
};

/**
 * District overview: totals first, then how the livestock is distributed, then
 * the households behind those numbers.
 *
 * The page is a server component for metadata; data fetching happens in the
 * client component because the API requires the authenticated token.
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
