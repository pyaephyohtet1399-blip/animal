import {
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  labelMm: string;
  href: string;
  icon: LucideIcon;
  /**
   * Feature modules are registered here first and enabled in the phase that
   * builds them, so navigation order never changes between phases.
   */
  enabled: boolean;
  /**
   * If provided, only users with these roles see the item.
   * When omitted, the item is visible to all authenticated roles.
   */
  allowedRoles?: string[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: "အထွေထွေသုံးသပ်ချက်",
    items: [
      {
        label: "ပင်မဒက်ရှ်ဘုတ်",
        labelMm: "ပင်မဒက်ရှ်ဘုတ်",
        href: "/dashboard",
        icon: LayoutDashboard,
        enabled: true,
      },
    ],
  },
  {
    title: "သန်းခေါင်စာရင်း",
    items: [
      {
        label: "သန်းခေါင်စာရင်း မှတ်တမ်းများ",
        labelMm: "သန်းခေါင်စာရင်း မှတ်တမ်းများ",
        href: "/census",
        icon: ClipboardList,
        enabled: true,
      },
    ],
  },
  {
    title: "ဆန်းစစ်ချက်များ",
    items: [
      {
        label: "စစ်တမ်းကောက်ယူမှု အကျဉ်းချုပ်",
        labelMm: "စာရင်းများ",
        href: "/reports",
        icon: ChartColumn,
        enabled: true,
      },
    ],
  },
];